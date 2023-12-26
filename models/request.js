const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;