const express = require("express");
const router = express.Router();
const path = require("path");
const Conversation = require("../../models/conversation");
const validateConversation = require("../../middlewares/modelsValidation/validateConversation");
const Message = require("../../models/message");
const Account = require("../../models/account");
const Upload = require("../../models/upload");

router.post("/create", validateConversation, async (req, res) => {
    const { participants, name, icon } = req.body;
    if (!req.connected) {
        res.status(401).json({ error: "Vous n'êtes pas autorisé à effectuer cela!" });
    }
    const userId = req.user.id;

    if (participants.includes(userId)) {
        return res.status(400).json({ error: "Vous ne pouvez pas créer une conversation avec vous même !" });
    }

    participants.push(userId);
    const existingConversation = await Conversation.findOne({
        participants: {
            $size: 2,
            $all: participants,
        },
    });
    if (existingConversation) {
        return res.status(400).json({ error: "Une conversation avec cet utilisateur existe déjà !" });
    }

    function saveConversation(conversation) {
        conversation
            .save()
            .then((conversation) =>
                res.status(201).json({
                    _id: conversation._id,
                    participants: conversation.participants,
                    conversationName: conversation.name,
                    conversationType: conversation.type,
                    owner: conversation.owner,
                    administrators: conversation.administrators,
                    lastUsage: conversation.lastUsage,
                    conversationIcon: conversation.icon,
                })
            )
            .catch((error) => res.json({ error }));
    }
    const isGroupConversation = participants.length > 2;
    if (isGroupConversation) {
        const conversation = new Conversation({
            participants,
            type: "group",
            owner: userId,
            administrators: [],
            name: isGroupConversation ? name || "Groupe sans nom" : null,
            lastUsage: Date.now(),
            icon: isGroupConversation ? "64c6a4a24ee85cf03846170d" : icon,
        });
        saveConversation(conversation);
    } else {
        const conversation = new Conversation({
            participants,
            type: "private",
            lastUsage: Date.now(),
        });
        saveConversation(conversation);
    }
});

router.delete("/delete", async (req, res) => {
    if (!req.connected || req.user.id !== req.alumetObj.owner) return res.status(401).json({ error: "Not authorized" });
    try {
        const conversation = await Conversation.findOne({ _id: req.params.conversation, alumet: req.alumetObj._id });
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });
        await conversation.delete();
        res.json({ message: "Conversation deleted" });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.get("/", async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id }).sort({ lastUsage: -1 });
        const filteredConversations = await Promise.all(
            conversations.map(async (conversation) => {
                const participants = conversation.participants.filter((participant) => participant !== req.user.id);
                const lastMessage = await Message.findOne({ reference: conversation._id }).sort({ _id: -1 });
                let lastMessageObject = {};
                if (lastMessage && lastMessage.content) {
                    let senderAccount = await Account.findOne({ _id: lastMessage.sender });
                    if (senderAccount.name == req.user.name) {
                        senderAccount.name = "Vous";
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

                return { ...conversation.toObject(), participants, lastMessage: lastMessageObject, isReaded: isReaded, conversationId: conversationId, conversationName: conversation.name, conversationIcon: conversation.icon };
            })
        );
        res.json(filteredConversations);
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.get("/search", async (req, res) => {
    const searchQuery = req.query.q.trim();
    if (searchQuery.length < 2) {
        return res.json([]);
    }
    const [firstName, lastName] = searchQuery.split(" ");
    try {
        const contacts = await Account.find(
            {
                $and: [{ _id: { $ne: req.user._id } }, { name: { $regex: firstName.toString(), $options: "i" } }, { lastname: { $regex: lastName ? lastName.toString() : "", $options: "i" } }],
            },
            "_id name lastname icon accountType"
        );
        res.json(contacts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:conversation", async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ _id: req.params.conversation, participants: req.user.id });
        if (!conversation) return res.status(404).json({ error: "Conversation not found" });
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(401).json({ error: "Not authorized" });
        }
        const conversationOwner = conversation.owner;
        const conversationAdministrators = conversation.administrators;
        const participantsPromises = conversation.participants.map(async (participant) => {
            const role = participant === conversationOwner ? "owner" : conversationAdministrators.includes(participant) ? "administrator" : "member";
            const user = await Account.findOne({ _id: participant }, { name: 1, lastname: 1, icon: 1 });
            return { id: user._id, name: user.name, lastname: user.lastname, icon: user.icon, role };
        });
        const participants = await Promise.all(participantsPromises);
        Message.find({ reference: conversation._id })
            .sort({ _id: -1 })
            .limit(50)
            .then(async (messages) => {
                const conversationId = conversation._id;
                const conversationName = conversation.name;
                const conversationIcon = conversation.icon;

                if (messages.length === 0) {
                    return res.json({ conversationId, conversationName, conversationIcon, messages: [], participants, role: "member", conversationType: conversation.type });
                }

                const messagePromises = messages.map(async (message) => {
                    const user = await Account.findOne({ _id: message.sender }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1 });
                    return { message, user };
                });

                const messageObjects = await Promise.all(messagePromises);
                const lastMessage = messageObjects[0].message;

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
                    role: conversationOwner === req.user.id ? "owner" : conversationAdministrators.includes(req.user.id) ? "administrator" : "member",
                });
            })
            .catch((error) => {
                console.error(error);
                res.json({ error });
            });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

router.post("/:conversation/userRole/:user", async (req, res) => {
    const { conversation, user } = req.params;
    console.log("conversation: " + conversation, "user :" + user);
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: "Aucune conversation trouvée" });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner === user) {
        return res.json({ role: "owner" });
    }
    if (conversationObj.administrators.includes(user)) {
        return res.json({ role: "administrator" });
    }
    return res.json({ role: "member" });
});

router.get("/findOrCreate/:user", async (req, res) => {
    const { user } = req.params;
    const userId = req.user._id.toString();
    if (user === userId) {
        return res.status(400).json({ error: "Vous ne pouvez pas créer une conversation avec vous même !" });
    }
    const participants = [userId, user];
    console.log(participants);
    const existingConversation = await Conversation.findOne({
        participants: {
            $size: 2,
            $all: participants,
        },
        type: "private",
    });
    if (existingConversation) {
        return res.json({ conversationId: existingConversation._id });
    }
    return res.json({ conversationId: null });
});

router.post("/:conversation/promoteOwner/:userId", async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: "Aucune conversation trouvée" });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner !== req.user.id) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: "Cet utilisateur est déjà propriétaire" });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    conversationObj.owner = userId;
    conversationObj
        .save()
        .then(() => res.json({ message: "Utilisateur promu" }))
        .catch((error) => res.json({ error }));
});

router.post("/:conversation/promoteAdmin/:userId", async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: "Aucune conversation trouvée" });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    console.log("id user : ", req.user.id);
    console.log("id owner : ", conversationObj.owner);
    if (conversationObj.owner !== req.user.id) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (conversationObj.administrators.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur est déjà administrateur" });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: "Vous ne pouvez pas promouvoir le propriétaire de la conversation" });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    conversationObj.administrators.push(userId);
    conversationObj
        .save()
        .then(() => res.json({ message: "Utilisateur promu" }))
        .catch((error) => res.json({ error }));
});

router.post("/:conversation/demoteAdmin/:userId", async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: "Aucune conversation trouvée" });
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
    conversationObj.administrators = conversationObj.administrators.filter((administrator) => administrator !== userId);
    conversationObj
        .save()
        .then(() => res.json({ message: "Utilisateur rétrogradé" }))
        .catch((error) => res.json({ error }));
});

router.post("/:conversation/removeUser/:userId", async (req, res) => {
    const { conversation, userId } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) return res.status(404).json({ error: "Aucune conversation trouvée" });
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    if (!conversationObj.participants.includes(userId)) {
        return res.status(400).json({ error: "Cet utilisateur n'est pas dans la conversation" });
    }
    if (conversationObj.owner === userId) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer le propriétaire de la conversation" });
    }
    if (conversationObj.owner === req.user.id || conversationObj.administrators.includes(req.user.id)) {
        conversationObj.participants = conversationObj.participants.filter((participant) => participant !== userId);
        conversationObj.administrators = conversationObj.administrators.filter((administrator) => administrator !== userId);
        conversationObj
            .save()
            .then(() => res.json({ message: "Utilisateur supprimé de la conversation" }))
            .catch((error) => res.json({ error }));
        return;
    }
    return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
});

router.post("/:conversation/leave", async (req, res) => {
    const { conversation } = req.params;
    const conversationObj = await Conversation.findOne({ _id: conversation, participants: req.user.id });
    if (!conversationObj) {
        return res.status(404).json({ error: "Aucune conversation trouvée" });
    }
    if (!conversationObj.participants.includes(req.user.id)) {
        return res.status(401).json({ error: "Vous n'êtes pas authorisé à faire cela" });
    }
    console.log(conversationObj.participants.length);
    if (conversationObj.participants.length > 1 && conversationObj.owner.equals(req.user.id)) {
        return res.status(400).json({ error: "Vous ne pouvez pas quitter la conversation car vous en êtes le propriétaire" });
    }
    const newParticipants = conversationObj.participants.filter((participant) => !participant.equals(req.user.id));
    const newAdministrators = conversationObj.administrators.filter((administrator) => !administrator.equals(req.user.id));
    if (newParticipants.length === 0) {
        conversationObj
            .remove()
            .then(() => res.json({ message: "Conversation supprimée" }))
            .catch((error) => res.json({ error }));
    } else {
        conversationObj.participants = newParticipants;
        conversationObj.administrators = newAdministrators;
        conversationObj
            .save()
            .then(() => res.json({ message: "Vous avez quitté la conversation" }))
            .catch((error) => res.json({ error }));
    }
});

router.put("/:conversation/updateicon", async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ _id: req.params.conversation, participants: req.user.id });
        const allowedExtensions = ["jpg", "jpeg", "png"];
        const iconFile = await Upload.findById(req.body.icon);
        const fileExtension = iconFile.mimetype;

        if (!conversation) return res.status(404).json({ error: "Aucune conversation trouvée" });
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(401).json({ error: "Vous n'êtes pas authorisé à effectuer cela" });
        }
        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json({
                error: "Seuls les fichiers jpg, jpeg et png sont autorisés !",
            });
        }

        if (iconFile.filesize > 1 * 1024 * 1024) {
            return res.status(400).json({
                error: "La taille de l'image ne doit pas dépasser 1 Mo !",
            });
        }

        console.log(req.body);
        conversation.icon = req.body.icon;
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

router.post("/send", async (req, res) => {
    const { message, conversationId } = req.body;
    const sender = req.user.id;
    const reference = conversationId;
    const isReaded = false;
    const newMessage = new Message({ sender, content: message, reference, isReaded });
    const user = await Account.findOne({ _id: sender }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1 });
    newMessage
        .save()
        .then((message) => {
            Conversation.findOneAndUpdate({ _id: conversationId }, { lastUsage: Date.now() })
                .then(() => {
                    res.status(201).json({ message, user });
                })
                .catch((error) => res.json({ error }));
        })
        .catch((error) => res.json({ error }));
});

router.delete("/:message", async (req, res) => {
    try {
        const message = await Message.findOne({ _id: req.params.message, participants: req.user.id });
        if (!message) return res.status(404).json({ error: "Message non trouvé" });
        if (!message.participants.includes(req.user.id)) {
            return res.status(401).json({ error: "Vous n'êtes pas authorisé à supprimer ce message" });
        }
        await message.delete();
        res.json({ message: "Message supprimé" });
    } catch (error) {
        console.error(error);
        res.json({ error });
    }
});

module.exports = router;
