const mongoose = require("mongoose");
const { Decimal128 } = mongoose.Types;

const AlumetSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 150
    },
    description: {
        type: String,
        maxLength: 2000
    },
    owner: {
        type: String,
        required: true,
        minLength: 1
    },
    collaborators: {
        type: Array,
        required: false,
        default: []
    },
    participants: {
        type: Array,
        required: false,
        default: []
    },
    password : {
        type: String,
        required: false,
        minLength: 1,
        maxLength: 150
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now()
    },
    font: {
        type: String,
        required: true,
        default: "pjs"
    },
    background: {
        type: String,
        required: true,
    },
    customsLinks: {
        type: Array,
        required: true,
        default: []
    },
    brightness: {
        type: Decimal128,
        required: true,
        default: 0.80
    },
    blur: {
        type: Decimal128,
        required: true,
        default: 5
    },
});

const Alumet = mongoose.model("Alumet", AlumetSchema);
module.exports = Alumet;