const mongoose = require('mongoose');

const mindmapSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    title: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 150,
    },
    description: {
        type: String,
        maxLength: 300,
    },
    subject: {
        type: String,
        required: false,
        minLength: 2,
        maxLength: 50,
        default: 'Autre',
        enum: ['Mathématiques', 'Français', 'Histoire', 'Géographie', 'Physique', 'Svt', 'Technologie', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Russe', 'Chinois', 'Japonais', 'Autre'],
    },
    isPublic: {
        type: Boolean,
        required: true,
    },
    collaborators: {
        type: [String],
        required: false,
        minLength: 2,
        maxLength: 50,
    },
    lastUsage: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const mindmap = mongoose.model('Mindmap', mindmapSchema);
module.exports = mindmap;
