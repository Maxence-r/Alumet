const path = require('path');

const sanitizeFilename = filename => {
    const fallback = 'file';
    const safeName = path.basename(String(filename || fallback)).replace(/[^a-zA-Z0-9_.-]/g, '_');
    return safeName || fallback;
};

const extensionFromName = filename => {
    const ext = path.extname(String(filename || '')).replace('.', '').toLowerCase();
    return ext;
};

module.exports = { sanitizeFilename, extensionFromName };
