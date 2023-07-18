const mongoose = require("mongoose");

const NotificationSchema = mongoose.Schema({
    action: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 500
    },
    owner: {
        type: String,
        required: true,
    },
    alumet: {
        type: String,
        required: true,
        minLength: 2,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;