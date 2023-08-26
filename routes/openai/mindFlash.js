const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const pdfjsLib = require("pdfjs-dist");
const Upload = require("../../models/upload");
require("dotenv").config();

async function getContent(src) {
    const document = await Upload.findOne({ _id: src });
    if (document.mimetype !== "pdf") return "Le fichier n'est pas un pdf";

    const url = "http://localhost:3000/cdn/u/" + src;
    const pdf = await pdfjsLib.getDocument(url).promise;

    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str).join("");
        return text;
    }
}

router.post("/generate", async (req, res) => {
    try {
        const { src } = req.body;
        const content = await getContent(src);
        await main(content);
        res.json({ content });
    } catch (error) {
        res.send(error);
    }
});

// Use the OpenAI module here

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main(pdfText) {
    async function main() {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: 'You are always given a raw text pdf document. You must answer only a set of flashcards in a json format "question" "answer".' },
                { role: "user", content: pdfText },
            ],
            model: "gpt-3.5-turbo",
        });
        console.log(completion.choices[0]);
    }
}
module.exports = router;
