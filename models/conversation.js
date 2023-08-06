const mongoose = require("mongoose");

const ConversationSchema = mongoose.Schema({
    participants: {
        type: Array,
        required: true,
        validate: [arrayLimit, "Must have at least 2 participants"],
    },
    name: {
        type: String,
        required: false,
        minLength: 1,
        maxLength: 50,
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

function arrayLimit(val) {
    return val.length > 1;
}

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;
