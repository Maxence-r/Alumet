require('dotenv').config();
function moderation(req, res, next) {
    const inputData = JSON.stringify({ input: req.body.message });

    const apiUrl = 'https://api.openai.com/v1/moderations';

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: inputData,
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (!data.results[0]) {
                next();
            } else if (data.results[0].flagged) {
                res.status(400).json({
                    error: 'Votre message a été modéré',
                });
            } else {
                next();
            }
        })
        .catch(error => console.error(error));
}
module.exports = moderation;
