const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
    title: {
        type: String,
        minLength: 1,
        maxLength: 300
    },
    content: {
        type: String,
        minLength: 1,
        maxLength: 800
    },
    owner: {
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
        type: String,
        minLength: 1,
        maxLength: 300,
        required: false,
    },
    color: {
        type: String,
        required: true,
        default: "ffffff"
    },
    position: {
        type: Number,
        required: true,
        default: 0
    },
    wallId: {
        type: String,
        required: true,
    },
    isVisible: {
        type: Boolean,
        required: true,
        default: true
    },
    postDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    commentAuthorized: {
        type: Boolean,
        required: true,
        default: false
    },
});



const Post = mongoose.model("Post", PostSchema);
module.exports = Post;