const mongoose = require('mongoose');

const FolderSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 50,
    },
    owner: {
        type: String,
        required: true,
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now(),
    },
});

const Folder = mongoose.model('Folder', FolderSchema);
module.exports = Folder;
