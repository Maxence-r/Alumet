const mongoose = require("mongoose");

const UploadSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true,
        minLength: 2
    },
    originalname: {
        type: String,
        required: true,
        minLength: 1
    },
    filesize: {
        type: Number,
        required: true,
    },
    date : {
        type: Date,
        required: true,
        default: Date.now()
    },
    mimetype: {
        type: String,
        required: true,
        minLength: 1
    },
    owner: {
        type: String,
        required: true,
        minLength: 1
    }
});



const Upload = mongoose.model("Upload", UploadSchema);
module.exports = Upload;