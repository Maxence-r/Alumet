const mongoose = require("mongoose");

const HomeworkSchema = mongoose.Schema({
    content: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 500
    },
    time : {
        type: Date,
        required: true,
        default: Date.now
    }
});

const Homework = mongoose.model("Homework", HomeworkSchema);
module.exports = Homework;