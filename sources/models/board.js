const mongoose = require("mongoose");

const BoardSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    alumet: {
        type: String,
        required: true
    },
    interact: {
        type: Boolean,
        required: true,
        default: false
    },
    public : {
        type: Boolean,
        required: true,
        default: false
    }
});



const Board = mongoose.model("Board", BoardSchema);
module.exports = Board;