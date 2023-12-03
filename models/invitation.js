const mongoose = require('mongoose');

const InvitationSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    type: {
        type: String,
        required: true,
        enum: ['alumet', 'flashcards', 'mindmaps'],
    },
    reference: {
        type: String,
        required: true,
    },
});

const Invitation = mongoose.model('Invitation', InvitationSchema);
module.exports = Invitation;
