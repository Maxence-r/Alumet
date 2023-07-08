const mongoose = require("mongoose");

const MailSchema = mongoose.Schema({
    mail: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 100
    },
    level: {
        type: Number,
        required: true,
        default: 1
    },
    data : {
        type: Date,
        required: true,
        default: Date.now()
    }
});

const Mail = mongoose.model("Mail", MailSchema);
module.exports = Mail;