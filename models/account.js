const mongoose = require('mongoose');

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
        required: true,
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
        default: 'defaultUser',
    },
    notifications: {
        type: Array,
        required: false,
        default: ['messageP', 'messageG', 'invitationC', 'commentP', 'alumetA'],
    },
    badges: {
        type: Array,
        required: true,
        default: [],
    },
    experimental: {
        type: Boolean,
        required: true,
        default: false,
    },
    aiCredits: {
        type: Number,
        required: true,
        default: 0,
    },
});

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
