const mongoose = require('mongoose');

const flashcardSchema = mongoose.Schema({
    flashcardSetId: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 200,
    },
    answer: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 200,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    userDatas: [
        {
            userId: String,
            status: {
                type: Number,
                default: 1,
                enum: [0, 1, 2, 3],
            },
            lastReview: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

const flashcard = mongoose.model('flashcard', flashcardSchema);
module.exports = flashcard;
