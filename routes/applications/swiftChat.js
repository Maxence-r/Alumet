const express = require('express');
const router = express.Router();
const path = require('path');
const Conversation = require('../../models/conversation');
const validateConversation = require('../../middlewares/modelsValidation/validateConversation');
const { upload, uploadAndSaveToDb } = require('../../middlewares/utils/uploadHandler');
const Message = require('../../models/message');
const Account = require('../../models/account');
const authorize = require('../../middlewares/authentification/authorize');

router.post('/create', validateConversation, async (req, res) => {
    const { participants, name, icon } = req.body;
    if (!req.connected) {
        res.status(401).json({ error: "Vous n'êtes pas autorisé à effectuer cela!" });
    }
    const userId = req.user.id;

    if (participants.includes(userId)) {
        return res.status(400).json({ error: 'Vous ne pouvez pas créer une conversation avec vous même !' });
    }

    participants.push(userId);
    const existingConversation = await Conversation.findOne({
        participants: {
            $size: 2,
            $all: participants,
        },
    });
    if (existingConversation) {
        return res.status(400).json({ error: 'Une conversation avec cet utilisateur existe déjà !' });
    }

    function saveConversation(conversation) {
        conversation
            .save()
            .then(async conversation => {
                let userinfos = {};
                if (conversation.type === 'private') {
                    const otherParticipant = conversation.participants.find(participant => participant !== req.user.id);
                    const user = await Account.findOne({ _id: otherParticipant }, { name: 1, lastname: 1, icon: 1 });
                    userinfos = { id: user._id, name: user.name, lastname: user.lastname, icon: user.icon };
                }
                res.status(201).json({
                    _id: conversation._id,
                    participants: conversation.participants,
                    conversationName: conversation.name,
                    conversationType: conversation.type,
                    owner: conversation.owner,
                    administrators: conversation.administrators,
                    lastUsage: conversation.lastUsage,
                    conversationIcon: conversation.icon,
                    userinfos,
                });
            })
            .catch(error => res.json({ error }));
    }
    const isGroupConversation = participants.length > 2;
    if (isGroupConversation) {
        const conversation = new Conversation({
            participants,
            type: 'group',
            owner: userId,
            administrators: [],
            name: isGroupConversation ? name || 'Groupe sans nom' : null,
            lastUsage: Date.now(),
            icon: isGroupConversation ? '64c6a4a24ee85cf03846170d' : icon,
        });
        saveConversation(conversation);
    } else {
        const conversation = new Conversation({
            participants,
            type: 'private',
            lastUsage: Date.now(),
        });
        saveConversation(conversation);
    }
});

router.delete('/delete', async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: 'Not authorized' });
    try {
        const conversation = await Conversation.findOne({ _id: req.params.conversation, alumet: req.alumetObj._id });
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        await conversation.delete();
        res.json({ message: 'Conversation deleted' });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.get('/', async (req, res) => {
    try {
        const conversations = await Conversation.find({
            $or: [{ participants: req.user.id }, { administrators: req.user.id }, { owner: req.user.id }],
        }).sort({ lastUsage: -1 });
        const filteredConversations = await Promise.all(
            conversations.map(async conversation => {
                const participants = conversation.participants.filter(participant => participant !== req.user.id);
                const lastMessage = await Message.findOne({ reference: conversation._id }).sort({ _id: -1 });
                let lastMessageObject = {};
                if (lastMessage && lastMessage.content) {
                    let senderAccount = await Account.findOne({ _id: lastMessage.sender });
                    if (senderAccount.name == req.user.name) {
                        senderAccount.name = 'Vous';
                    }
                    lastMessageObject = { content: lastMessage.content, sender: senderAccount.name };
                } else {
                    lastMessageObject = {};
                }

                let isReaded = lastMessage ? lastMessage.isReaded : true;
                if (lastMessage && String(lastMessage.sender) === req.user.id) {
                    isReaded = true;
                }
                const conversationId = conversation._id;
                let userinfos = {};
                if (conversation.type === 'private') {
                    const otherParticipant = conversation.participants.find(participant => participant !== req.user.id);
                    const user = await Account.findOne({ _id: otherParticipant }, { name: 1, lastname: 1, icon: 1 });
                    if (user !== null) {
                        userinfos = { id: user._id.toString(), name: user.name, lastname: user.lastname, icon: user.icon };
                    }
                }

                return { ...conversation.toObject(), participants, lastMessage: lastMessageObject, isReaded: isReaded, conversationId: conversationId, conversationName: conversation.name, conversationIcon: conversation.icon, userinfos };
            })
        );
        res.json(filteredConversations);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

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
                    { _id: { $ne: req.user._id } },
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

router.get('/:conversation', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversation,
            $or: [{ participants: req.user.id }, { administrators: req.user.id }, { owner: req.user.id }],
        });
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const conversationOwner = conversation.owner;
        const conversationAdministrators = conversation.administrators;
        const participantsPromises = conversation.participants.map(async participant => {
            const role = participant === conversationOwner ? 'owner' : conversationAdministrators.includes(participant) ? 'administrator' : 'member';
            const user = await Account.findOne({ _id: participant }, { name: 1, lastname: 1, icon: 1 });
            return { id: user._id, name: user.name, lastname: user.lastname, icon: user.icon, role };
        });
        const participants = await Promise.all(participantsPromises);
        Message.find({ reference: conversation._id })
            .sort({ _id: -1 })
            .limit(50)
            .then(async messages => {
                const conversationId = conversation._id;
                const conversationName = conversation.name;
                const conversationIcon = conversation.icon;

                const messagePromises = messages.map(async message => {
                    const user = await Account.findOne({ _id: message.sender }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1, badges: 1, username: 1 });
                    return { message, user };
                });

                const messageObjects = await Promise.all(messagePromises);
                const lastMessage = messageObjects[0] ? messageObjects[0].message : 'Pas de message';

                if (lastMessage && !lastMessage.isReaded && String(lastMessage.sender) !== req.user.id) {
                    await Message.findOneAndUpdate({ _id: lastMessage._id }, { isReaded: true });
                }

                res.json({
                    conversationId,
                    conversationName,
                    conversationType: conversation.type,
                    conversationIcon,
                    messages: messageObjects.reverse(),
                    participants,
                    role: conversationOwner === req.user.id ? 'owner' : conversationAdministrators.includes(req.user.id) ? 'administrator' : 'member',
                });
            })
            .catch(error => {
                console.error(error);
                res.json({ error });
            });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.post('/:conversation/promoteOwner/:userId', async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: 'Aucune conversation trouvée' });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner !== req.user.id) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: 'Cet utilisateur est déjà propriétaire' });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    conversationObj.owner = userId;
    conversationObj
        .save()
        .then(() => res.json({ message: 'Utilisateur promu' }))
        .catch(error => res.json({ error }));
});

router.post('/:conversation/promoteAdmin/:userId', async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: 'Aucune conversation trouvée' });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner !== req.user.id) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.administrators.includes(userId)) {
        return res.status(400).json({ error: 'Cet utilisateur est déjà administrateur' });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: 'Vous ne pouvez pas promouvoir le propriétaire de la conversation' });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    conversationObj.administrators.push(userId);
    conversationObj
        .save()
        .then(() => res.json({ message: 'Utilisateur promu' }))
        .catch(error => res.json({ error }));
});

router.post('/:conversation/demoteAdmin/:userId', async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: 'Aucune conversation trouvée' });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner !== req.user.id) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (!conversationObj.administrators.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas administrateur" });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    conversationObj.administrators = conversationObj.administrators.filter(administrator => administrator !== userId);
    conversationObj
        .save()
        .then(() => res.json({ message: 'Utilisateur rétrogradé' }))
        .catch(error => res.json({ error }));
});

router.post('/:conversation/removeUser/:userId', async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: 'Aucune conversation trouvée' });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer le propriétaire de la conversation' });
    }
    if (conversationObj.owner === req.user.id || conversationObj.administrators.includes(req.user.id)) {
        conversationObj.participants = conversationObj.participants.filter(participant => participant !== userId);
        conversationObj.administrators = conversationObj.administrators.filter(administrator => administrator !== userId);
        conversationObj
            .save()
            .then(() => res.json({ message: 'Utilisateur supprimé de la conversation' }))
            .catch(error => res.json({ error }));
        return;
    }
    return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
});

router.post('/:conversation/leave', async (req, res) => {
    const { conversation } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) {
        return res.status(404).json({ error: 'Aucune conversation trouvée' });
    }
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.participants.length > 1 && conversationObj.owner === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas quitter la conversation car vous en êtes le propriétaire' });
    }
    const newParticipants = conversationObj.participants.filter(participant => participant !== req.user.id);
    const newAdministrators = conversationObj.administrators.filter(administrator => administrator !== req.user.id);
    if (newParticipants.length === 0) {
        conversationObj
            .remove()
            .then(() => res.json({ message: 'Conversation supprimée' }))
            .catch(error => res.json({ error }));
    } else {
        conversationObj.participants = newParticipants;
        conversationObj.administrators = newAdministrators;
        conversationObj
            .save()
            .then(() => res.json({ message: 'Vous avez quitté la conversation' }))
            .catch(error => res.json({ error }));
    }
});

router.put('/:conversation/updateicon', upload.single('file'), uploadAndSaveToDb('1', ['png', 'jpeg', 'jpg']), async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversation,
            $or: [{ administrators: req.user.id }, { owner: req.user.id }],
        });

        if (!conversation) return res.status(404).json({ error: "Vous n'avez pas la permission" });

        conversation.icon = req.upload._id;
        await conversation.save();
        res.status(200).json({
            icon: conversation.icon,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.post('/send/:conversation', authorize(), async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.conversation,
        $or: [{ participants: req.user.id }, { administrators: req.user.id }, { owner: req.user.id }],
    });
    if (!conversation) return res.status(404).json({ error: 'Unauthorized area' });
    const { message } = req.body;
    const { conversation: conversationId } = req.params;
    const sender = req.user.id;
    const reference = conversationId;
    const isReaded = false;
    const newMessage = new Message({ sender, content: message, reference, isReaded });
    const user = await Account.findOne({ _id: sender }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1, badges: 1, username: 1 });
    newMessage
        .save()
        .then(message => {
            Conversation.findOneAndUpdate({ _id: conversationId }, { lastUsage: Date.now() })
                .then(() => {
                    res.status(201).json({ message, user });
                })
                .catch(error => {
                    console.error(error);
                    res.json({ error });
                });
        })
        .catch(error => {
            res.json({ error });
        });
});

router.delete('/:message', async (req, res) => {
    try {
        const message = await Message.findOne({ _id: req.params.message, participants: req.user.id });
        if (!message) return res.status(404).json({ error: 'Message non trouvé' });
        if (!message.participants.includes(req.user.id)) {
            return res.status(401).json({ error: "Vous n'êtes pas authorisé à supprimer ce message" });
        }
        await message.delete();
        res.json({ message: 'Message supprimé' });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

module.exports = router;
