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
    dateCreated: {
        type: Date,
        default: Date.now
    },
    userDatas: [{
        userId: String,
        level: {
            type: Number,
            default: 0
        },
        numberOfGood: {
            type: Number,
            default: 0
        },
        lastReview: {
            type: Date,
        },
        nextReview: {
            type: Date,
        }
    }],
});

const flashcard = mongoose.model("flashcard", flashcardSchema);
module.exports = flashcard;
