const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pdfjsLib = require('pdfjs-dist');
const Upload = require('../../models/upload');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const Account = require('../../models/account');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function getContent(src) {
    const document = await Upload.findOne({ _id: src });
    if (document.mimetype !== 'pdf') return null;

    const url = 'http://localhost:3000/cdn/u/' + src;
    const pdf = await pdfjsLib.getDocument(url).promise;

    const numPages = pdf.numPages;
    const textPagesPromises = Array.from({ length: numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        return content.items.map(item => item.str).join('');
    });

    const textPages = await Promise.all(textPagesPromises);
    const text = textPages.join('');
    let infoMessage = '';
    if (text.length < 50) {
        throw new Error("Le fichier n'est pas assez volumineux");
    } else if (text.length > 30001) {
        infoMessage = 'Le fichier est trop volumineux, il a été tronqué à 30000 caractères';
    }
    const content = text.match(/.{1,7500}/g);
    return { content, infoMessage };
}

async function generateFlashcards(messages, userId) {
    const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo-1106',
        response_format: { type: 'json_object' },
    });
    const gptAnswer = completion.choices[0].message.content;
    const start = gptAnswer.indexOf('[');
    const end = gptAnswer.lastIndexOf(']');

    if (start === -1 || end === -1) {
        console.error('ERROR: ', gptAnswer);
        return [];
    }
    let account = await Account.findOne({ _id: userId });
    account.aiCredits -= 1;
    await account.save();

    let flashcards = gptAnswer.substring(start, end + 1);
    return JSON.parse(flashcards);
}
//TODO - verify if it's okay to merge the two functions
async function gptFlashcardGeneration(generationMode, numberOfFlashcards, subject, text, userId) {
    if (subject === 'other') {
        subject = '';
    }

    let instructions = '';
    if (generationMode === 'document') {
        instructions =
            "the raw text of a PDF, focusing on core content while ignoring formatting, page numbers, and professor's educational instructions. Ensure EVERY single flashcard uses the language of the document. YOU MUST MAXIMIZE the number of flashcards generate the MOST POSSIBLE, keeping text brief around 50 characters max, avoid sentence if possible.";
    } else if (generationMode === 'keywords') {
        instructions = `Leverage your knowledge to create ${numberOfFlashcards} flashcards in FRENCH. Each should cover a different aspect of the subjects, emphasizing key concepts. Achieve the exact count of ${numberOfFlashcards} for a complete subject overview, with ultra-brief text on each card.`;
    } else if (generationMode === 'youtube') {
        instructions = `Develop ${numberOfFlashcards} flashcards using subject-related videos. Each card should capture a unique concept or aspect, using the language of the subjects. Ensure the set totals exactly ${numberOfFlashcards}, with concise text for comprehensive coverage.`;
    }

    const flashcardsPromises = text.map(part =>
        generateFlashcards(
            [
                {
                    role: 'system',
                    content: `Create flashcards for ${subject} in JSON format. Each flashcard is an object with 'question' and 'answer' fields. Maximize the number of flashcards, with ultra-brief and relevant content. Every single flashcard must be in the language of the raw text, even if you add your own knowledge. Generate these flashcards using ${instructions}`,
                },
                { role: 'user', content: part },
            ],
            userId
        )
    );

    const flashcardsArrays = await Promise.all(flashcardsPromises);
    return [].concat(...flashcardsArrays).filter(flashcard => flashcard.question.length < 150 && flashcard.answer.length < 150 && flashcard.question.length > 1 && flashcard.answer.length > 1);
}

router.post('/generate-flashcards', rateLimit(2), async (req, res) => {
    if (!req.user || req.user.experimental === false) return res.json({ error: "Vous devez être inscrit à l'offre expérimentale pour utiliser cette fonctionnalité" });
    if (req.user.aiCredits < 1) return res.json({ error: "Vous n'avez pas assez de crédits pour utiliser cette fonctionnalité" });
    try {
        let { generationMode, numberOfFlashcards, schoolLevel, subject, data } = req.body;
        let message = '';
        if (generationMode === 'document') {
            const { content, infoMessage } = await getContent(data);
            if (!content) throw new Error("Le fichier n'est pas un pdf");
            data = content;
            message = infoMessage;
        }
        const flashcards = await gptFlashcardGeneration(generationMode, numberOfFlashcards, subject, data, req.user.id);
        res.json({ flashcards, message });
    } catch (error) {
        res.json({ error: error.message });
    }
});
module.exports = router;
