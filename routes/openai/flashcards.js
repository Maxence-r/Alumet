const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pdfjsLib = require('pdfjs-dist');
const Upload = require('../../models/upload');
const rateLimit = require('../../middlewares/authentification/rateLimit');
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
        throw new Error('Le fichier n\'est pas assez volumineux');
    } else if (text.length > 30001) {
        infoMessage = 'Le fichier est trop volumineux, il a été tronqué à 30000 caractères';
    }
    const content = text.match(/.{1,7500}/g);
    return { content, infoMessage };
};

async function generateFlashcards(messages) {
    const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo-1106',
        response_format: { type: "json_object" }
    });
    const gptAnswer = completion.choices[0].message.content;
    const start = gptAnswer.indexOf('[');
    const end = gptAnswer.lastIndexOf(']');

    if (start === -1 || end === -1) {
        console.error('ERROR: ', gptAnswer);
        return [];
    };

    let flashcards = gptAnswer.substring(start, end + 1);
    return JSON.parse(flashcards);
}
//TODO - verify if it's okay to merge the two functions
async function gptFlashcardGeneration(generationMode, numberOfFlashcards, schoolLevel, subject, text) {
    subject == 'other' ? subject = '' : null;
    console.log(text.length)
    const flashcardsPromises = text.map(part => generateFlashcards([
        { role: 'system', content: `You are an assistant of flashcard creation for ${subject} students and you're now in ${generationMode} generation mode. You must follow some rules as a perfect ia flashcards creation assistant.`},
        { role: 'assistant', content: 'Okay. What are those rules ?'},
        { role: 'system', content: 'You must answer in a json format an array of flashcards object with question and answer properties. Those properties must be quite short, concise and always in the language of the document' },
        { role: 'assistant', content: 'Okay. I understand. What is the level of the student ?'},
        { role: 'system', content: `Your flashcards are adressed to a ${schoolLevel} student, adjust the difficulty of your flashcards accordingly.` },
        { role: 'assistant', content: 'How many flashcards do you want ?'},
        { role: 'system', content: `You must answer ${numberOfFlashcards} flashcards. By the way, you must do not answer sentences but use keywords in your questions and answers in order to be short as possible. The shorter, the best! Last but not least, don't create flashcards of examples: it's useless!` },
        { role: 'assistant', content: 'Okay. I will do my best. Let\'s start !'},           
        { role: 'user', content: part },
    ]));
    const flashcardsArrays = await Promise.all(flashcardsPromises);
    return [].concat(...flashcardsArrays).filter(flashcard => flashcard.question.length < 100 && flashcard.answer.length < 100 && flashcard.question.length > 1 && flashcard.answer.length > 1);
}

router.post('/generate-flashcards', rateLimit(2), async (req, res) => {
    try {
        let { generationMode, numberOfFlashcards, schoolLevel, subject, data } = req.body;
        let message = '';
        if (generationMode === 'document') {
            const { content, infoMessage } = await getContent(data);
            if (!content) throw new Error("Le fichier n'est pas un pdf");
            data = content;
            message = infoMessage;
        }
        const flashcards = await gptFlashcardGeneration(generationMode, numberOfFlashcards, schoolLevel, subject, data);
        res.json({ flashcards, message });

    } catch (error) {
        res.json({ error: error.message });
    }
});
module.exports = router;