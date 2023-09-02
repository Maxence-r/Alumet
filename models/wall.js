const mongoose = require('mongoose');

const WallSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 150,
    },
    postAuthorized: {
        type: Boolean,
        required: true,
        default: false,
    },
    position: {
        type: Number,
        required: true,
        default: 0,
    },
    alumetReference: {
        type: String,
        required: true,
    },
});

const Wall = mongoose.model('Wall', WallSchema);
module.exports = Wall;
