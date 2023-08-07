const mongoose = require("mongoose");

const ConversationSchema = mongoose.Schema({
    participants: {
        type: Array,
        required: true,
    },
    name: {
        type: String,
        required: false,
        minLength: 1,
        maxLength: 50,
    },
    type: {
        type: String,
        required: true,
        enum: ["group", "private"],
    },
    owner: {
        type: String,
        required: false,
        minLength: 1,
    },
    administrators: {
        type: Array,
        required: false,
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    icon: {
        type: String,
        required: false,
        minLength: 1,
    },
});

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;
