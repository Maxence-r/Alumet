const mongoose = require('mongoose');

const IncidentSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 300,
    },
    description: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 5000,
    },
    level: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now(),
    },
});

const Incident = mongoose.model('Incident', IncidentSchema);
module.exports = Incident;
