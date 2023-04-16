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
    type: {
        type: String,
    },
    typeContent: {
        type: String,
    },
    color: {
        type: String,
        required: true,
        default: "default"
    },
    position: {
        type: Number,
        required: true,
        default: 0
    },
    wallId: {
        type: String,
        required: true,
    }
});



const Post = mongoose.model("Post", PostSchema);
module.exports = Post;