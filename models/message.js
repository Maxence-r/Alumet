const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 500
    },
    time: {
        type: Date,
        required: true,
        default: Date.now
    },
    reference : {
        type: String,
        required: true
    },
    isReaded: {
        type: Boolean,
        required: true,
        default: false
    }
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;