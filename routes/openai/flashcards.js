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
    let message = '';
    if (text.length < 50) {
        throw new Error('Le fichier n\'est pas assez volumineux');
    } else if (text.length > 30001) {
        message = 'Le fichier est trop volumineux, il a été tronqué à 30000 caractères';
    }
    const content = text.match(/.{1,7500}/g);
    return { content, message };
};

async function gptDocument(parts) {
    const input_list = [];
    const output_list = [];
    const flashcardsPromises = parts.map(async part => {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: "You are given a raw pdf. You must answer in a json format an array of 10-15 flashcards objects with question and answer properties. Those properties must be short and concise (use key words)." },
                { role: 'user', content: part },
            ],
            model: 'gpt-3.5-turbo-1106',
            response_format: { type: "json_object" }
        });
        const gptAnswer = completion.choices[0].message.content;
        const start = gptAnswer.indexOf('[');
        const end = gptAnswer.lastIndexOf(']');

        if (start === -1 || end === -1) {
            console.log('ERROR');
            console.log(gptAnswer);
            return [];
        };

        let flashcardsPart = gptAnswer.substring(start, end + 1);
        flashcardsPart = JSON.parse(flashcardsPart);

        input_list.push(part);
        output_list.push(flashcardsPart);
        console.log('1 part done');
        return flashcardsPart;
    });

    const flashcardsArrays = await Promise.all(flashcardsPromises);
    
    const flashcards = [].concat(...flashcardsArrays);
    console.log('flashcards: ', flashcards);
    console.log('nombre de flashcards : ', flashcards.length);
    to_jsonl(input_list, output_list);
    return flashcards;
};

function to_jsonl(input_list, output_list) {
    let jsonl_str = '';
    for (let i = 0; i < input_list.length; i++) {
        let inp = input_list[i];
        let out = output_list[i];
        let json_obj = {
            "messages": [
                {"role": "system", "content": "You are given a raw pdf. You must answer in a codeblock in a json format an array of 10-15 flashcards objects with question and answer properties. Those properties must be short and concise (don't hesitate to use key words). Don't say nothing more outside the codeblock."},
                {"role": "user", "content": inp},
                {"role": "assistant", "content": out}
            ]
        };
        jsonl_str += JSON.stringify(json_obj) + '\n';
    };

    fs.appendFile(path.join(__dirname, 'fine-tunning-flashcards.jsonl'), jsonl_str, (err) => {
    if (err) {
        console.error('Une erreur s\'est produite lors de l\'écriture du fichier :', err);
    } else {
        console.log('Le texte JSONL a été ajouté au fichier JSONL.');
    }
    });
};

async function gptKeywords(keywords) {
    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: "You are an assistant of flashcard creation for students. You are given some keywords, you have to answer AN ARRAY of minimum 8 flashcards objects with question and answer properties in json format. Properties have to be in french and only composed of keywords (less than 60 characters per property). Finally, your flashcards must be pertinent and concise in order to help students progress."},
            { role: 'user', content: keywords },
        ],
        model: 'gpt-3.5-turbo-1106',
        response_format: { type: "json_object" },
    });
    const gptAnswer = completion.choices[0].message.content;
    const start = gptAnswer.indexOf('[');
    const end = gptAnswer.lastIndexOf(']');

    if (start === -1 || end === -1) {
        console.log('ERROR');
        console.log(gptAnswer);
        return [];
    };

    let flashcards = gptAnswer.substring(start, end + 1);
    flashcards = JSON.parse(flashcards);
    console.log('flashcards: ', flashcards);
    flashcards = flashcards.filter(flashcard => flashcard.question.length < 100 && flashcard.answer.length < 100 && flashcard.question.length > 1 && flashcard.answer.length > 1);
    return flashcards;
}
 
router.post('/generate-document', async (req, res) => {
    try {
        const { src } = req.body;
        const { content, message } = await getContent(src);
        if (!content) throw new Error("Le fichier n'est pas un pdf");

        const flashcards = await gptDocument(content);
        res.json({ flashcards, message });
        
    } catch (error) {
        res.json({ error: error.message });
    }
});

router.post('/generate-keywords', async (req, res) => {
    try {
        /* console.log('Mindflash IA is starting his reflexion...')
        let { keywords } = req.body;
        keywords = keywords.join(', ');

        const flashcards = await gptKeywords(keywords);
        console.log('flashcards: ', flashcards); */
        const flashcards = [
            {
                "question": "Qu'est-ce que les mathématiques ?",
                "answer": "Les mathématiques étudient les nombres et les formes."
            },
            {
                "question": "Qu'est-ce qu'un nombre en mathématiques ?",
                "answer": "Un nombre est un concept qui permet de quantifier et de nommer une quantité."
            },
            {
                "question": "Que sont les opérations simples en maths CP ?",
                "answer": "Les opérations simples en CP incluent l'addition, la soustraction et la comparaison de nombres."
            },
            {
                "question": "Décris une forme géométrique en mathématiques.",
                "answer": "Une forme géométrique est une figure qui peut être décrite par ses côtés, ses angles et sa surface."
            },
            /* {
                "question": "Comment on apprend à compter en CP ?",
                "answer": "En CP, on apprend à compter jusqu'à 100, à reconnaître les chiffres et à représenter des quantités."
            },
            {
                "question": "Quelles compétences en mathématiques sont développées en CP ?",
                "answer": "En CP, les compétences en calcul, en résolution de problèmes, et en géométrie sont développées."
            } */
        ];
        res.json({ flashcards });
    } catch (error) {
        console.log(error);
        res.json({ error: error.message });
    }
});

module.exports = router;