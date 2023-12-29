const express = require('express');
const router = express.Router();
const Account = require('../../../models/account');



router.get('/search', async (req, res) => {
    const searchQuery = req.query.q.trim();
    const searchType = req.query.type;
    if (searchQuery.length < 2) {
        return res.json([]);
    }
    const [firstName, lastName] = searchQuery.split(' ');
    let accountTypeQuery = {};
    if (searchType === 'professor') {
        accountTypeQuery = { accountType: 'professor' };
    } else if (searchType === 'student') {
        accountTypeQuery = { accountType: 'student' };
    }
    try {
        const contacts = await Account.find(
            {
                $and: [
                    { _id: { $ne: req.user?._id } },
                    {
                        $or: [{ name: { $regex: searchQuery, $options: 'i' } }, { lastname: { $regex: searchQuery, $options: 'i' } }],
                    },
                    accountTypeQuery,
                ],
            },
            '_id name lastname icon accountType'
        );
        res.json(contacts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
