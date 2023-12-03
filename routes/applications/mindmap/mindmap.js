const express = require('express');
const router = express.Router();
const Mindmap = require('../../../models/mindmap');
const authorize = require('../../../middlewares/authentification/authorize');
const sendInvitations = require('../../../middlewares/mailManager/sendInvitations');

router.put('/set', authorize(), async (req, res) => {
    try {
        const { title, description, subject, isPublic, mindmapId } = req.body;
        let mindmap;
        if (mindmapId) {
            mindmap = await Mindmap.findById(mindmapId);
            if (mindmap.owner.toString() !== req.user._id.toString() && !mindmap.collaborators.includes(req.user?.id)) return res.json({ error: 'Unauthorized' });
            if (!mindmap) return res.redirect('/404');
            mindmap.title = title;
            mindmap.description = description;
            mindmap.isPublic = isPublic;
        } else {
            mindmap = new Mindmap({
                owner: req.user._id,
                title,
                description,
                subject,
                isPublic,
            });
        }
        await mindmap.save();
        if (!mindmapId) {
            sendInvitations(req, res, 'mindmaps', mindmap._id);
        }
        res.json({ mindmap });
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});

module.exports = router;
//
