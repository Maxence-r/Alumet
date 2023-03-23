const mongoose = require("mongoose");

const AlumetSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 2
    },
    description: {
        type: String,
        default: "Un endroit, pour tous !"
    },
    password : {
        type: String,
        required: false,
        minLength: 1
    }, 
    modules: {
        type: Array,
        required: true,
        default: []
    },
    font: {
        type: String,
        required: true,
        default: "pjs"
    },
    background: {
        type: String,
        required: true,
        default: "../assets/public/official-background.png"
    },
    theme: {
        type: String,
        required: true,
        default: "light"
    },
    customsLinks: {
        type: Array,
        required: true,
        default: []
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now()
    },
    archived: {
        type: Boolean,
        required: true,
        default: false
    }
});

const Alumet = mongoose.model("Alumet", AlumetSchema);
module.exports = Alumet;