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
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            default: 'new'
        }
    }],
    numberOfGood: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        numberOfGood: { 
            type: Number,
            default: 0
        }
    }],
    lastReview: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lastReview: {
            type: Date,
            default: Date.now
        }
    }],
    nextReview: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        nextReview: {
            type: Date,
            default: Date.now
        }
    }]
});

const flashcard = mongoose.model("flashcard", flashcardSchema);
module.exports = flashcard;
