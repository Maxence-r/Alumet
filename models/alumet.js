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
    security: {
        type: String,
        required: true,
        default: 'open',
        enum: ['open', 'onpassword', 'closed'],
    },
    password: {
        type: String,
        required: false,
        maxLength: 50,
    },
    subject: {
        type: String,
        required: false,
        minLength: 2,
        maxLength: 50,
        default: 'Autre',
        enum: ['Mathématiques', 'Français', 'Histoire', 'Géographie', 'Physique', 'Svt', 'Technologie', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Russe', 'Chinois', 'Japonais', 'Autre'],
    },
    participants: [
        {
            userId: String,
            status: {
                type: Number,
                default: 2,
                enum: [0, 1, 2, 3], // 0 - owner, 1 - admin, 2 - user, 3 - banned
            }
        },
    ],
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
        default: 'defaultAlumet',
    },
    customsLinks: {
        type: Array,
        required: true,
        default: [],
    },
    code: {
        type: String,
        required: true,
        default: randomNumericCode(),
    },
    type: {
        type: String,
        required: true,
        default: 'alumet',
        enum: ['alumet', 'flashcard', 'mindmap'],
    },
    discovery: {
        type: Boolean,
        required: true,
        default: false,
    },
});

const Alumet = mongoose.model('Alumet', AlumetSchema);
module.exports = Alumet;
