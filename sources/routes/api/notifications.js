const express = require('express');
const router = express.Router();
const Notification = require('../../models/notification');
const Alumet = require('../../models/alumet');


router.get('/', async (req, res) => {
    if (!req.logged) return res.status(401).json({ error: 'Not logged' });
    try {
        const alumets = await Alumet.find({ owner: req.user.id });
        const notifications = [];

        for (const alumet of alumets) {
            const alumetNotifications = await Notification.find({ alumet: alumet._id }).sort({ date: -1 }).limit(30);
            alumetNotifications.forEach(notification => {
                notification.alumet = alumet.name;
            });
            notifications.push(...alumetNotifications);
        }

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.json({ error });
    } 
});


module.exports = router;