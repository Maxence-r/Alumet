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

async function main(parts) {
    const input_list = [];
    const output_list = [];
    const flashcardsPromises = parts.map(async part => {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: "You are given a raw pdf. You must answer in a codeblock in a json format an array of 10-15 flashcards objects with question and answer properties. Those properties must be short and concise (don't hesitate to use key words). Don't say nothing more outside the codeblock." },
                { role: 'user', content: part },
            ],
            model: 'gpt-3.5-turbo',
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

async function getContent(src) {
    const document = await Upload.findOne({ _id: src });
    if (document.mimetype !== 'pdf') return "Le fichier n'est pas un pdf";

    const url = 'http://localhost:3000/cdn/u/' + src;
    const pdf = await pdfjsLib.getDocument(url).promise;

    const numPages = pdf.numPages;
    const textPages = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str).join('');
        textPages.push(text);
    }
    const text = textPages.join('');
    if (text.length < 100) {
        throw new Error('Le fichier n\'est pas assez volumineux');
    } else if (text.length > 30001) {
        throw new Error('Le fichier est trop volumineux');
    }

    const parts = textPages.join('').match(/.{1,7500}/g);
    return parts;
};
 
router.post('/generate', async (req, res) => {
    try {
        const src = '654bffbdc710e0f843355e02'; //ID test
        console.log('source du pdf : ', src);

        const content = await getContent(src);
        if (!content) throw new Error("Le fichier n'est pas un pdf");

        const flashcards = await main(content);
        
        res.json({ flashcards });
        
    } catch (error) {
        res.json({ error: error.message });
    }
});
module.exports = router;