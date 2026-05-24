const isApiRequest = req => {
    if (req.xhr) {
        return true;
    }

    const accept = req.get('accept') || '';
    return accept.includes('application/json') || req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/openai/');
};

const sendError = (res, status, message, details) => {
    const payload = { error: message };
    if (details) {
        payload.details = details;
    }

    return res.status(status).json(payload);
};

module.exports = { isApiRequest, sendError };
