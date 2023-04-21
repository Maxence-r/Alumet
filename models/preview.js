const mongoose = require("mongoose");

const previewSchema = mongoose.Schema({
    origin: {
        type: String,
        required: true,
    }
});



const Preview = mongoose.model("Preview", previewSchema);
module.exports = Preview;