const config = require('../../config/env');
const logger = require('../../utils/logger');

function moderation(req, res, next) {
    if (!config.openai.apiKey) {
        return next();
    }

    const inputData = JSON.stringify({ input: req.body.message });

    const apiUrl = 'https://api.openai.com/v1/moderations';

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: inputData,
    })
        .then(response => response.json())
        .then(data => {
            if (!data.results[0]) {
                next();
            } else if (data.results[0].flagged) {
                res.status(400).json({
                    error: 'Your message was moderated',
                });
            } else {
                next();
            }
        })
        .catch(error => {
            logger.warn('Moderation request failed', error.message);
            next();
        });
}
module.exports = moderation;
