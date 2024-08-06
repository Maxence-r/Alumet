const mongoose = require("mongoose");

const AccountSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 30,
    },
    lastname: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 30,
    },
    username: {
        type: String,
        required: false,
        minLength: 2,
        maxLength: 25,
    },
    mail: {
        type: String,
        required: true,
        minLength: 5,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    accountType: {
        type: String,
        required: true,
    },
    isA2FEnabled: {
        type: Boolean,
        required: true,
        default: false,
    },
    subjects: {
        type: Array,
        required: false,
        default: [],
    },
    icon: {
        type: String,
        required: false,
        default: "defaultUser",
    },
    notifications: {
        type: Array,
        required: false,
        default: ["messageG", "invitationC", "commentP", "experiments"],
    },
    badges: {
        type: Array,
        required: true,
        default: [],
    },
    suspended: {
        reason: {
            type: String,
            required: false,
        },
        date: {
            type: Date,
            required: false,
        },
    },
    experiments: {
        type: Array,
        required: true,
        default: [],
    },
});

const Account = mongoose.model("Account", AccountSchema);
module.exports = Account;
