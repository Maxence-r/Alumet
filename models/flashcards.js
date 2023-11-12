const mongoose = require('mongoose');
const { object } = require('sharp/lib/is');

const flashcardSchema = mongoose.Schema({
    flashcardSetId: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100,
    },
    answer: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100,
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
            smartReview: {
                type: object,
                default: {
                    nextReview: null,
                    inRow: 0,
                },
            }
        },
    ],
});

const flashcard = mongoose.model('flashcard', flashcardSchema);
module.exports = flashcard;
