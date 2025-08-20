const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    owner: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    postId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 1000,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

commentSchema.index({ postId: 1, createdAt: 1 });

const comment = mongoose.model('comment', commentSchema);
module.exports = comment;
