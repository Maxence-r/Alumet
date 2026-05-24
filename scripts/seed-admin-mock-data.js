require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Account = require("../models/account");
const Alumet = require("../models/alumet");
const Wall = require("../models/wall");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Flashcard = require("../models/flashcards");
const Folder = require("../models/folder");
const Upload = require("../models/upload");
const Notification = require("../models/notification");
const Invitation = require("../models/invitation");
const Incident = require("../models/incident");

const ADMIN_MAIL = "admin@admin.admin";
const ADMIN_PASSWORD = "adminadmin";
const MOCK_DOMAIN = "mock.alumet.local";

const daysAgo = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = days => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const mockUsers = [
    ["Amina", "Benali", "student", ["beta"]],
    ["Lucas", "Martin", "student", []],
    ["Nora", "Petit", "student", ["verified"]],
    ["Theo", "Durand", "student", []],
    ["Clara", "Moreau", "professor", ["verified"]],
    ["Hugo", "Bernard", "professor", []],
    ["Ines", "Robert", "student", ["chasseur_de_bug"]],
    ["Maya", "Leroy", "student", []],
];

const samplePosts = [
    ["Kickoff notes", "Welcome everyone. Add your questions, files, blockers, and ideas here.", "d9f2ff"],
    ["Useful resource", "Read chapter 3 before Friday and post one takeaway in the comments.", "fff5cc"],
    ["Exercise batch", "Solve exercises 4, 5, and 7. We will compare strategies in class.", "e7ffe6"],
    ["Office hours", "I will be available tomorrow from 16:00 to 17:30 for quick reviews.", "f4e8ff"],
    ["Peer review", "Pair up and leave one constructive comment on another group's work.", "ffe8ee"],
];

async function removePreviousSeed(adminId) {
    const mockAccounts = await Account.find({ mail: { $regex: `@${MOCK_DOMAIN}$` } }).select("_id");
    const userIds = [adminId, ...mockAccounts.map(account => account._id.toString())];

    const alumets = await Alumet.find({
        $or: [{ owner: { $in: userIds } }, { "participants.userId": { $in: userIds } }],
    }).select("_id");
    const alumetIds = alumets.map(alumet => alumet._id.toString());

    const walls = await Wall.find({ alumetReference: { $in: alumetIds } }).select("_id");
    const wallIds = walls.map(wall => wall._id.toString());

    const posts = await Post.find({
        $or: [{ owner: { $in: userIds } }, { wallId: { $in: wallIds } }],
    }).select("_id");
    const postIds = posts.map(post => post._id.toString());

    const conversations = await Conversation.find({
        $or: [{ owner: { $in: userIds } }, { participants: { $in: userIds } }, { administrators: { $in: userIds } }],
    }).select("_id");
    const conversationIds = conversations.map(conversation => conversation._id.toString());

    const uploads = await Upload.find({ owner: { $in: userIds } }).select("_id");
    const uploadIds = uploads.map(upload => upload._id.toString());

    await Promise.all([
        Comment.deleteMany({ $or: [{ owner: { $in: userIds } }, { postId: { $in: postIds } }] }),
        Post.deleteMany({ $or: [{ owner: { $in: userIds } }, { wallId: { $in: wallIds } }] }),
        Wall.deleteMany({ alumetReference: { $in: alumetIds } }),
        Flashcard.deleteMany({ flashcardSetId: { $in: alumetIds } }),
        Alumet.deleteMany({ _id: { $in: alumetIds } }),
        Message.deleteMany({ $or: [{ sender: { $in: userIds } }, { reference: { $in: conversationIds } }] }),
        Conversation.deleteMany({ _id: { $in: conversationIds } }),
        Folder.deleteMany({ owner: { $in: userIds } }),
        Upload.deleteMany({ _id: { $in: uploadIds } }),
        Notification.deleteMany({ owner: { $in: userIds } }),
        Invitation.deleteMany({ $or: [{ owner: { $in: userIds } }, { to: { $in: userIds } }] }),
    ]);

    await Account.deleteMany({ mail: { $regex: `@${MOCK_DOMAIN}$` } });
}

async function upsertAdmin() {
    const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    return Account.findOneAndUpdate(
        { mail: ADMIN_MAIL },
        {
            name: "Admin",
            lastname: "Admin",
            username: "admin",
            mail: ADMIN_MAIL,
            password,
            accountType: "staff",
            isA2FEnabled: false,
            subjects: ["mathematics", "history", "english", "nsi", "other"],
            icon: "defaultUser",
            notifications: ["messageP", "messageG", "invitationC", "commentP", "alumetA", "experiments"],
            badges: ["staff", "verified", "beta", "moderateur", "chasseur_de_bug"],
            suspended: {},
            experiments: ["disableAlumet"],
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

async function createMockAccounts() {
    return Account.insertMany(
        mockUsers.map(([name, lastname, accountType, badges], index) => ({
            name,
            lastname,
            username: `${name[0]}${lastname}`.toLowerCase(),
            mail: `${name.toLowerCase()}.${lastname.toLowerCase()}@${MOCK_DOMAIN}`,
            password: "$2b$10$uUa5s4e4n8U7U32XHETm2O61Mseccx8stYWYCt6KLSZy8Kc.tmgEW",
            accountType,
            isA2FEnabled: index === 2,
            subjects: accountType === "professor" ? ["mathematics", "history"] : ["english", "nsi", "other"],
            icon: "defaultUser",
            notifications: ["messageG", "invitationC", "commentP", "experiments"],
            badges,
            suspended: {},
            experiments: index % 2 === 0 ? ["disableAlumet"] : [],
        }))
    );
}

async function createUploadsAndFolders(adminId) {
    const folders = await Folder.insertMany([
        { name: "Course materials", owner: adminId, lastUsage: daysAgo(1) },
        { name: "Student work", owner: adminId, lastUsage: daysAgo(3) },
        { name: "Meeting notes", owner: adminId, lastUsage: daysAgo(7) },
    ]);

    const uploads = await Upload.insertMany([
        { filename: "mock-course-plan.pdf", displayname: "Course plan.pdf", filesize: 284120, mimetype: "pdf", owner: adminId, folder: folders[0]._id.toString(), modifiable: true, date: daysAgo(1) },
        { filename: "mock-rubric.pdf", displayname: "Evaluation rubric.pdf", filesize: 138420, mimetype: "pdf", owner: adminId, folder: folders[0]._id.toString(), modifiable: true, date: daysAgo(2) },
        { filename: "mock-board.png", displayname: "Whiteboard snapshot.png", filesize: 488992, mimetype: "png", owner: adminId, folder: folders[1]._id.toString(), modifiable: true, date: daysAgo(3) },
        { filename: "mock-notes.txt", displayname: "Retrospective notes.txt", filesize: 18422, mimetype: "txt", owner: adminId, folder: folders[2]._id.toString(), modifiable: true, date: daysAgo(4) },
    ]);

    return { folders, uploads };
}

async function createAlumets(admin, users, uploads) {
    const adminId = admin._id.toString();
    const participants = users.map((user, index) => ({
        userId: user._id.toString(),
        status: index < 2 ? 1 : index === users.length - 1 ? 4 : 2,
    }));

    const alumets = await Alumet.insertMany([
        {
            title: "Admin demo workspace",
            description: "A busy collaborative workspace with posts, comments, files, and scheduled content.",
            owner: adminId,
            subject: "other",
            participants,
            private: false,
            swiftchat: true,
            lastUsage: daysAgo(0),
            type: "alumet",
            discovery: true,
            customsLinks: [
                { label: "Documentation", url: "https://education.alumet.io" },
                { label: "Support", url: "mailto:support@alumet.io" },
            ],
        },
        {
            title: "History revision group",
            description: "Mock class board for revision cards, timelines, and debate prompts.",
            owner: adminId,
            subject: "history",
            participants: participants.slice(0, 5),
            private: true,
            swiftchat: true,
            lastUsage: daysAgo(1),
            type: "alumet",
            discovery: false,
        },
        {
            title: "Mathematics practice",
            description: "Practice problems and checkpoints for algebra, geometry, and probability.",
            owner: adminId,
            subject: "mathematics",
            participants: participants.slice(1, 7),
            private: false,
            swiftchat: true,
            lastUsage: daysAgo(2),
            type: "alumet",
            discovery: true,
        },
        {
            title: "English vocabulary flashcards",
            description: "Spaced-repetition deck with classroom vocabulary and idioms.",
            owner: adminId,
            subject: "english",
            participants: participants.slice(0, 4),
            private: false,
            swiftchat: false,
            lastUsage: daysAgo(3),
            type: "flashcard",
            discovery: true,
        },
        {
            title: "NSI algorithms flashcards",
            description: "Revision deck for data structures, complexity, and Python basics.",
            owner: adminId,
            subject: "nsi",
            participants: participants.slice(2, 8),
            private: false,
            swiftchat: false,
            lastUsage: daysAgo(5),
            type: "flashcard",
            discovery: false,
        },
        {
            title: "Project mindmap",
            description: "Mock mindmap space for a term project.",
            owner: adminId,
            subject: "technology",
            participants: participants.slice(0, 6),
            private: false,
            swiftchat: true,
            lastUsage: daysAgo(6),
            type: "mindmap",
            discovery: false,
        },
    ]);

    const walls = [];
    const posts = [];
    const comments = [];

    for (const [alumetIndex, alumet] of alumets.filter(item => item.type === "alumet").entries()) {
        const createdWalls = await Wall.insertMany([
            { title: "Announcements", postAuthorized: false, position: 0, alumetReference: alumet._id.toString() },
            { title: "Resources", postAuthorized: true, position: 1, alumetReference: alumet._id.toString() },
            { title: "Questions", postAuthorized: true, position: 2, alumetReference: alumet._id.toString() },
            { title: "Done", postAuthorized: true, position: 3, alumetReference: alumet._id.toString() },
        ]);
        walls.push(...createdWalls);

        for (const [wallIndex, wall] of createdWalls.entries()) {
            for (let postIndex = 0; postIndex < samplePosts.length; postIndex++) {
                const [title, content, color] = samplePosts[(postIndex + wallIndex + alumetIndex) % samplePosts.length];
                posts.push({
                    title: `${title} ${wallIndex + 1}.${postIndex + 1}`,
                    content,
                    owner: postIndex % 3 === 0 ? users[postIndex % users.length]._id.toString() : adminId,
                    ip: "127.0.0.1",
                    file: postIndex === 1 ? uploads[postIndex % uploads.length]._id.toString() : null,
                    link: postIndex === 2 ? { title: "Example reference", url: "https://education.alumet.io", image: "", description: "Demo link metadata" } : undefined,
                    color,
                    position: postIndex,
                    wallId: wall._id.toString(),
                    adminsOnly: postIndex === 4 && wallIndex === 0,
                    postDate: postIndex === 3 ? daysFromNow(2) : null,
                    commentAuthorized: postIndex !== 0,
                    createdAt: daysAgo(postIndex + wallIndex + alumetIndex),
                });
            }
        }
    }

    const createdPosts = await Post.insertMany(posts);

    for (const [index, post] of createdPosts.entries()) {
        if (!post.commentAuthorized) {
            continue;
        }

        comments.push(
            { owner: users[index % users.length]._id.toString(), postId: post._id.toString(), content: "This is useful, I added it to my notes.", createdAt: daysAgo((index % 6) + 1) },
            { owner: adminId, postId: post._id.toString(), content: "Good point. I will clarify this during the next session.", createdAt: daysAgo(index % 4) }
        );
    }

    await Comment.insertMany(comments);

    await Flashcard.insertMany([
        ["English vocabulary flashcards", "What does 'reliable' mean?", "Something that can be trusted."],
        ["English vocabulary flashcards", "Give a synonym of 'quick'.", "Fast."],
        ["English vocabulary flashcards", "Translate 'prendre une decision'.", "To make a decision."],
        ["English vocabulary flashcards", "What is an idiom?", "A fixed expression with a figurative meaning."],
        ["English vocabulary flashcards", "Use 'although' in a sentence.", "Although it rained, we went outside."],
        ["NSI algorithms flashcards", "What is a stack?", "A LIFO data structure."],
        ["NSI algorithms flashcards", "What does O(n) mean?", "Runtime grows linearly with input size."],
        ["NSI algorithms flashcards", "What is recursion?", "A function calling itself with a base case."],
        ["NSI algorithms flashcards", "Name a sorting algorithm.", "Merge sort."],
        ["NSI algorithms flashcards", "What is a dictionary in Python?", "A key-value collection."],
    ].map(([setTitle, question, answer], index) => {
        const set = alumets.find(alumet => alumet.title === setTitle);
        return {
            flashcardSetId: set._id.toString(),
            question,
            answer,
            dateCreated: daysAgo(index),
            usersDatas: [
                { userId: adminId, status: index % 4, lastReview: Date.now() - index * 3600000, nextReview: Date.now() + (index + 1) * 86400000, inRow: index % 5 },
                { userId: users[index % users.length]._id.toString(), status: (index + 1) % 4, lastReview: Date.now() - index * 7200000, nextReview: Date.now() + (index + 2) * 86400000, inRow: index % 3 },
            ],
        };
    }));

    return alumets;
}

async function createConversations(admin, users, alumets) {
    const adminId = admin._id.toString();
    const conversations = await Conversation.insertMany([
        {
            participants: users.slice(0, 4).map(user => user._id.toString()),
            name: "Admin announcements",
            type: "group",
            owner: adminId,
            administrators: [adminId, users[4]._id.toString()],
            lastUsage: daysAgo(0),
            icon: "defaultUser",
        },
        {
            participants: [adminId, users[0]._id.toString()],
            name: "Amina Benali",
            type: "private",
            owner: adminId,
            administrators: [adminId],
            lastUsage: daysAgo(1),
            icon: "defaultUser",
        },
        {
            participants: alumets[0].participants.map(participant => participant.userId),
            name: alumets[0].title,
            type: "alumet",
            owner: adminId,
            administrators: [adminId],
            lastUsage: daysAgo(2),
            icon: "defaultUser",
        },
    ]);

    const messages = [];
    const lines = [
        "Welcome to the demo space.",
        "I pushed a new resource to the board.",
        "Can someone review the latest exercise?",
        "Looks good to me.",
        "I will add feedback before the next session.",
        "Thanks, that helped a lot.",
    ];

    conversations.forEach((conversation, conversationIndex) => {
        lines.forEach((content, index) => {
            const sender = index % 2 === 0 ? adminId : users[(index + conversationIndex) % users.length]._id.toString();
            messages.push({
                sender,
                content,
                reference: conversation._id.toString(),
                isReaded: index < 3,
                createdAt: new Date(Date.now() - (lines.length - index + conversationIndex) * 60 * 60 * 1000),
            });
        });
    });

    await Message.insertMany(messages);
}

async function createNotificationsInvitationsAndIncidents(admin, users, alumets) {
    const adminId = admin._id.toString();
    await Notification.insertMany([
        { action: "Amina commented on Kickoff notes.", owner: adminId, alumet: alumets[0]._id.toString(), date: daysAgo(0) },
        { action: "Lucas requested access to History revision group.", owner: adminId, alumet: alumets[1]._id.toString(), date: daysAgo(1) },
        { action: "New post added to Mathematics practice.", owner: adminId, alumet: alumets[2]._id.toString(), date: daysAgo(2) },
        { action: "Flashcards are ready for review.", owner: adminId, alumet: alumets[3]._id.toString(), date: daysAgo(3) },
    ]);

    await Invitation.insertMany([
        { owner: adminId, to: users[6]._id.toString(), reference: alumets[0]._id.toString(), createdAt: daysAgo(1) },
        { owner: users[4]._id.toString(), to: adminId, reference: alumets[1]._id.toString(), createdAt: daysAgo(4) },
        { owner: adminId, to: users[7]._id.toString(), reference: alumets[5]._id.toString(), createdAt: daysAgo(5) },
    ]);

    await Incident.insertMany([
        { title: "Mock upload latency", description: "Some large PDF uploads were slower than expected during demo data generation.", level: "low", createdAt: daysAgo(6) },
        { title: "Mock notification backlog", description: "A batch of demo notifications was queued for validation.", level: "medium", createdAt: daysAgo(3) },
        { title: "Mock moderation review", description: "One simulated post was flagged for review in the admin dashboard.", level: "high", createdAt: daysAgo(1) },
    ]);
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const admin = await upsertAdmin();
    await removePreviousSeed(admin._id.toString());

    const refreshedAdmin = await upsertAdmin();
    const users = await createMockAccounts();
    const { uploads } = await createUploadsAndFolders(refreshedAdmin._id.toString());
    const alumets = await createAlumets(refreshedAdmin, users, uploads);
    await createConversations(refreshedAdmin, users, alumets);
    await createNotificationsInvitationsAndIncidents(refreshedAdmin, users, alumets);

    const counts = {
        accounts: await Account.countDocuments(),
        alumets: await Alumet.countDocuments({ owner: refreshedAdmin._id.toString() }),
        walls: await Wall.countDocuments({ alumetReference: { $in: alumets.map(alumet => alumet._id.toString()) } }),
        posts: await Post.countDocuments(),
        comments: await Comment.countDocuments(),
        flashcards: await Flashcard.countDocuments(),
        conversations: await Conversation.countDocuments({ owner: refreshedAdmin._id.toString() }),
        uploads: await Upload.countDocuments({ owner: refreshedAdmin._id.toString() }),
        notifications: await Notification.countDocuments({ owner: refreshedAdmin._id.toString() }),
        invitations: await Invitation.countDocuments(),
        incidents: await Incident.countDocuments(),
    };

    console.log(JSON.stringify({ admin: ADMIN_MAIL, password: ADMIN_PASSWORD, adminId: refreshedAdmin._id.toString(), counts }, null, 2));
}

main()
    .then(() => mongoose.disconnect())
    .catch(error => {
        console.error(error);
        mongoose.disconnect().finally(() => process.exit(1));
    });
