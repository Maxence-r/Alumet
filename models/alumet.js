const mongoose = require('mongoose');
const { Decimal128 } = mongoose.Types;

function randomNumericCode() {
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

const AlumetSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 150,
    },
    description: {
        type: String,
        maxLength: 2000,
    },
    owner: {
        type: String,
        required: true,
        minLength: 1,
    },
    collaborators: {
        type: Array,
        required: false,
        default: [],
    },
    participants: {
        type: Array,
        required: false,
        default: [],
    },
    private: {
        type: Boolean,
        required: true,
        default: false,
    },
    swiftchat: {
        type: Boolean,
        required: true,
        default: true,
    },
    chat: {
        type: String,
        required: true,
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    font: {
        type: String,
        required: true,
        default: 'pjs',
    },
    background: {
        type: String,
        required: true,
        default: 'defaultAlumet',
    },
    customsLinks: {
        type: Array,
        required: true,
        default: [],
    },
    brightness: {
        type: Decimal128,
        required: true,
        default: 0.8,
    },
    blur: {
        type: Decimal128,
        required: true,
        default: 5,
    },
    code: {
        type: String,
        required: true,
        default: randomNumericCode(),
    },
});

const Alumet = mongoose.model('Alumet', AlumetSchema);
module.exports = Alumet;
