const mongoose = require("mongoose");

const flashcardSchema = mongoose.Schema({
    flashcardSetId: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    answer: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    status: [{
        userId: String,
        status: {
            type: String,
            default: 'unrated'
        }
    }],
    numberOfGood: [{
        userId: String,
        numberOfGood: { 
            type: Number,
            default: 0
        }
    }],
    lastReview: [{
        userId: String,
        lastReview: {
            type: Date,
            default: Date.now
        }
    }],
    nextReview: [{
        userId: String,
        nextReview: {
            type: Date,
            default: Date.now
        }
    }]
});

const flashcard = mongoose.model("flashcard", flashcardSchema);
module.exports = flashcard;
