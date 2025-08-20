const mongoose = require('mongoose');

const UploadSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true,
        minLength: 1,
    },
    displayname: {
        type: String,
        required: true,
        minLength: 1,
    },
    filesize: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    mimetype: {
        type: String,
        required: true,
        minLength: 1,
    },
    owner: {
        type: String,
        required: true,
        minLength: 1,
    },
    modifiable: {
        type: Boolean,
        default: true,
    },
    folder: {
        type: String,
        minLength: 1,
    },
});

UploadSchema.index({ owner: 1, date: -1 });
UploadSchema.index({ folder: 1, _id: -1 });

const Upload = mongoose.model('Upload', UploadSchema);
module.exports = Upload;
