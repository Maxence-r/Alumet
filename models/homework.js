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
    },
    alumet: {
        type: String,
        required: true,
        minLength: 2,
    }
});

const Homework = mongoose.model("Homework", HomeworkSchema);
module.exports = Homework;