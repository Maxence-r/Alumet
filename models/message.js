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
        maxLength: 50
    },
    time : {
        type: Date,
        required: true,
        default: Date.now
    },
    alumet : {
        type: String,
        required: true
    },
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;