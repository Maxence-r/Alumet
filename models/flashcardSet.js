const mongoose = require("mongoose");

const flashcardSetSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    title: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    description: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    subject: {
        type: String,
        required: false,
        minLength: 2,
        maxLength: 50
    },
    numberOfFlashcards: {
        type: Number,
        required: true,
        default: 0
    },
    partipants: {
        type: [String],
        required: false,
        minLength: 2,
        maxLength: 50
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const flashCardSet = mongoose.model("flashCardSet", flashcardSetSchema);
module.exports = flashCardSet;
