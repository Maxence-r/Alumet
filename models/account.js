const mongoose = require("mongoose");

const AccountSchema = mongoose.Schema({
    nom: {
        type: String,
        required: true,
        minLength: 2
    },
    prenom: {
        type: String,
        required: true,
        minLength: 2
    },
    mail : {
        type: String,
        required: true,
        minLength: 5
    }, 
    password: {
        type: String,
        required: true,
        default: "default"
    },
    status: {
        type: String,
        required: true,
        default: "Professeur"
    },
});



const Account = mongoose.model("Account", AccountSchema);
module.exports = Account;