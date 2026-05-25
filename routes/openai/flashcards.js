const express = require('express');
const router = express.Router();
const pdfjsLib = require('pdfjs-dist');
const Upload = require('../../models/upload');
const rateLimit = require('../../middlewares/authentification/rateLimit');
const { gpt } = require('gpti');
const config = require('../../config/env');
const logger = require('../../utils/logger');

async function getContent(src) {
    const document = await Upload.findOne({ _id: src });
    if (!document) throw new Error('File not found');
    if (document.mimetype !== 'pdf') return null;

    const url = config.server.publicBaseUrl + '/api/files/' + src + '/content';
    const pdf = await pdfjsLib.getDocument(url).promise;

    const numPages = pdf.numPages;
    const textPagesPromises = Array.from({ length: numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        return content.items.map(item => item.str).join('');
    });

    const textPages = await Promise.all(textPagesPromises);
    let text = textPages.join('');
    let infoMessage = '';
    if (text.length < 50) {
        throw new Error("The file is not large enough");
    } else if (text.length > config.openai.flashcardMaxChars) {
        infoMessage = `The file is too large and was truncated to ${config.openai.flashcardMaxChars} characters`;
        text = text.slice(0, config.openai.flashcardMaxChars);
    }
    const content = text.match(new RegExp(`.{1,${config.openai.flashcardChunkSize}}`, 'g'));
    return { content, infoMessage };
}

async function generateFlashcards(prompt) {
    try {
        const data = await new Promise((resolve, reject) => {
            gpt(
                {
                    messages: [],
                    prompt: prompt,
                    model: 'gpt-4-32k',
                    markdown: false,
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                }
            );
        });

        const gptAnswer = data.gpt;
        const start = gptAnswer.indexOf('[');
        const end = gptAnswer.lastIndexOf(']');

        if (start === -1 || end === -1) {
            logger.warn('AI flashcard response did not contain a JSON array');
            return [];
        }

        const flashcards = gptAnswer.substring(start, end + 1);

        return JSON.parse(flashcards);
    } catch (err) {
        logger.warn('AI flashcard generation failed', err.message);
        return [];
    }
}
//TODO - verify if it's okay to merge the two functions
async function gptFlashcardGeneration(generationMode, numberOfFlashcards, subject, text) {
    if (subject === 'other') {
        subject = '';
    }

    const contentParts = Array.isArray(text) ? text : [String(text || '')];
    if (!contentParts.some(part => part.trim().length > 0)) {
        throw new Error('No content provided');
    }

    let instructions = '';
    if (generationMode === 'document') {
        instructions = '';
    } else if (generationMode === 'keywords') {
        instructions = `Here the provided content are keywords ententered by the user, you need to add you own knowledge to the provided subjects, always prefer french if the language is not clear`;
    } else if (generationMode === 'youtube') {
        instructions = `Develop ${numberOfFlashcards} flashcards using subject-related videos. Each card should capture a unique concept or aspect, using the language of the subjects. Ensure the set totals exactly ${numberOfFlashcards}, with concise text for comprehensive coverage.`;
    }
    let prompt = `As a multilingual JSON expert AI, your mission is to produce a dense array of JSON ONLY (you can't send plain text) flashcards that encapsulate the essence of the provided content. Strictly follow these instructions: Craft a large number of flashcards that cover the entire document, focusing on core content while ignoring formatting, page numbers, and professor's educational instructions or reference to external ressources, someone who don't have the original content need to be able to learn the content. You MUST craft each flashcard in the language of the original content. Question and answer MUST be different. The shorter the flashcard, the better. Aim for under 40 characters for both 'question' and 'answer' fields, if possible, if you can't but an information is important then create. Generate the maximum number of flashcards possible without compromising their educational value, it need to cover the learned subject of the given content, cover the entire document thoroughly. Begin the JSON array of flashcard creation process with the following content, adhering to the above guidelines for succinct and informative learning aids in JSON ONLY ${instructions}:`;
    const flashcardsPromises = contentParts.map(part => generateFlashcards(prompt + part));

    const flashcardsArrays = await Promise.all(flashcardsPromises);
    const limit = Math.max(1, Math.min(Number.parseInt(numberOfFlashcards, 10) || 30, 100));

    return []
        .concat(...flashcardsArrays)
        .filter(flashcard => flashcard?.question && flashcard?.answer)
        .filter(flashcard => flashcard.question.length < 150 && flashcard.answer.length < 150 && flashcard.question.length > 1 && flashcard.answer.length > 1)
        .slice(0, limit);
}

router.post('/', rateLimit(2), async (req, res) => {
    if (!req.user || req.user.experiments.includes('aiFlashcards') === false) return res.json({ error: "You must be enrolled in the experimental offer to use this feature" });
    try {
        let { generationMode, numberOfFlashcards, subject, data } = req.body;
        let message = '';
        if (generationMode === 'document') {
            const { content, infoMessage } = await getContent(data);
            if (!content) throw new Error("The file is not a PDF");
            data = content;
            message = infoMessage;
        }
        const flashcards = await gptFlashcardGeneration(generationMode, numberOfFlashcards, subject, data);
        res.json({ flashcards, message });
    } catch (error) {
        res.json({ error: error.message });
    }
});
module.exports = router;
