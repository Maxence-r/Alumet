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
        maxLength: 60,
    },
    answer: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 60,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    userDatas: [
        {
            userId: String,
            status: {
                type: String,
                default: 'neutral',
                enum: ['bad', 'medium', 'good', 'neutral']
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
