const mongoose = require("mongoose");


const A2FSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    code: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50
    },
    expireAt: {
        type: Date,
        required: true
    }
});

const A2F = mongoose.model("A2F", A2FSchema);
module.exports = A2F;
