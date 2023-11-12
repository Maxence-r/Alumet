const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pdfjsLib = require('pdfjs-dist');
const Upload = require('../../models/upload');
const path = require('path');
const fs = require('fs');
const { set } = require('mongoose');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function getContent(src) {
    const document = await Upload.findOne({ _id: src });
    if (document.mimetype !== 'pdf') return "Le fichier n'est pas un pdf";

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

async function gptFlashcardGeneration(parameter, data) {
    switch (parameter) {
        case 'document':
            const flashcardsPromises = data.map(part => generateFlashcards([
                { role: 'system', content: "You are given a raw pdf. You must answer in a json format an array of 10-15 flashcards objects with question and answer properties. Those properties must be short and concise (use key words)." },
                { role: 'user', content: part },
            ]));
            const flashcardsArrays = await Promise.all(flashcardsPromises);
            return [].concat(...flashcardsArrays);
        case 'keywords':
            const flashcards = await generateFlashcards([
                { role: 'system', content: "You are an assistant of flashcard creation for students. You are given some keywords, you have to answer AN ARRAY of minimum 8 flashcards objects with question and answer properties in json format. Properties have to be in french and only composed of keywords (less than 60 characters per property). Finally, your flashcards must be pertinent and concise in order to help students progress."},
                { role: 'user', content: data },
            ]);
            return flashcards.filter(flashcard => flashcard.question.length < 100 && flashcard.answer.length < 100 && flashcard.question.length > 1 && flashcard.answer.length > 1);
        default:
            throw new Error('Le paramètre est invalide');
    }
}

router.post('/generate-flashcards', async (req, res) => {
    try {
        let { parameter, data } = req.body;
        let message = '';
        switch (parameter) {
            case 'document':
                const { content, infoMessage } = await getContent(data);
                if (!content) throw new Error("Le fichier n'est pas un pdf");
                data = content;
                message = infoMessage;
                break;
            case 'keywords':
                data = data.join(', ');
                break;
            default:
                throw new Error('Le paramètre est invalide');
        }
        const flashcards = await gptFlashcardGeneration(parameter, data);
        res.json({ flashcards, message });

    } catch (error) {
        res.json({ error: error.message });        
    }
});
module.exports = router;