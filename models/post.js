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
    ownerType: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: "default"
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
    },
    visible: {
        type: Boolean,
        required: true,
        default: true
    }, 
    tcs: {
        type: Boolean,
        required: true,
        default: false
    }
});



const Post = mongoose.model("Post", PostSchema);
module.exports = Post;