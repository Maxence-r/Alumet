const mongoose = require('mongoose');

const AccountSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    lastname: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    mail: {
        type: String,
        required: true,
        minLength: 5,
    },
    password: {
        type: String,
        required: true,
        minLength: 4,
        default: 'default',
    },
    accountType: {
        type: String,
        required: true,
    },
    isCertified: {
        type: Boolean,
        required: true,
        default: false,
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
        default: 'default',
    },
    notifications: {
        type: Array,
        required: false,
        default: ['messages'],
    },
});

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
