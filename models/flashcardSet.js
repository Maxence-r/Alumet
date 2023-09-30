const mongoose = require('mongoose');

const flashcardSetSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    title: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    description: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 300,
    },
    subject: {
        type: String,
        required: false,
        minLength: 2,
        maxLength: 50,
    },
    isPublic: {
        type: Boolean,
        required: true,
    },
    collaborators: {
        type: [String],
        required: false,
        minLength: 2,
        maxLength: 50,
    },
});

const flashCardSet = mongoose.model('flashCardSet', flashcardSetSchema);
module.exports = flashCardSet;
