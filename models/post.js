const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    title: {
        type: String,
        maxLength: 300,
    },
    content: {
        type: String,
        maxLength: 4000,
    },
    owner: {
        type: String,
    },
    ip: {
        type: String,
        required: true,
    },
    file: {
        type: String,
        minLength: 1,
        maxLength: 300,
        required: false,
    },
    link: {
        type: Object,
        required: false,
    },
    color: {
        type: String,
        required: true,
        default: 'ffffff',
    },
    position: {
        type: Number,
        required: true,
        default: 0,
    },
    wallId: {
        type: String,
        required: true,
    },
    adminsOnly: {
        type: Boolean,
        required: true,
        default: false,
    },
    postDate: {
        type: Date,
    },
    commentAuthorized: {
        type: Boolean,
        required: true,
        default: false,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
