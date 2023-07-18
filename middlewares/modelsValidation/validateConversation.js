const mongoose = require('mongoose');
const Upload = require('../../models/upload');

function validateConversation(req, res, next) {
    if (!req.connected) {
        return res.status(401).json({error: "Unauthorized"});
    }
    if(req.body.participants) {
        if(!Array.isArray(req.body.participants)) {
            return res.status(400).json({error: "Participants must be an array"});
        }
        req.body.participants.forEach(participant => {
            if(!mongoose.Types.ObjectId.isValid(participant)) {
                return res.status(400).json({error: "Invalid participant id"});
            }
        });
    }

    if(req.body.icon) {
        Upload.findById(req.body.icon)
            .then(upload => {
                console.log(upload);
                if(!upload || !['jpg', 'png', 'jpeg'].includes(upload.mimetype)) {
                    return res.status(400).json({error: "Invalid icon id"});
                }
                next();
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({error: "Internal server error"});
            });
    } else {
        next();
    };

    if(req.body.participants.length > 2) {
        req.body.owner = req.user._id;
    }
}
  
module.exports = validateConversation;