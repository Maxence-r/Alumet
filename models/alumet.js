const mongoose = require('mongoose');
const { Decimal128 } = mongoose.Types;

function randomNumericCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 6);
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
        default: '644a1e2b71748e4521eba8a3',
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
