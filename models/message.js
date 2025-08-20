const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 2000,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    reference: {
        type: String,
        required: true,
    },
    isReaded: {
        type: Boolean,
        required: true,
        default: false,
    },
});

MessageSchema.index({ reference: 1, createdAt: -1 });

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
