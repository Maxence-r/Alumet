const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    route: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

RequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });
RequestSchema.index({ ip: 1, route: 1, createdAt: -1 });

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;
