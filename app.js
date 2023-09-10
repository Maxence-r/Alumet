const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const authentification = require('./middlewares/authentification/authentification');

const dashboard = require('./routes/api/alumetGlobal/dashboard');
const profile = require('./routes/api/alumetGlobal/profile');
const uploader = require('./routes/api/alumetGlobal/uploader');
const alumet = require('./routes/api/alumet/alumet');
const auth = require('./routes/api/alumetGlobal/auth');
const portal = require('./routes/api/alumetGlobal/portal');
const alumetRender = require('./routes/routing/alumet');
const preview = require('./routes/utils/preview');
const viewer = require('./routes/utils/viewer');

const homeworks = require('./routes/applications/eduTasker');
const board = require('./routes/applications/ideaFlow');
const mindFlash = require('./routes/applications/mindFlash');
const swiftChat = require('./routes/applications/swiftChat');

const wall = require('./routes/api/alumet/wall');
const post = require('./routes/api/alumet/post');
const notifications = require('./routes/api/alumet/notifications');

const mindFlashAi = require('./routes/openai/mindFlash');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./views'));
app.use(express.static('./cdn'));

mongoose.set('strictQuery', true);
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connexion à MongoDB réussie !');
    } catch (err) {
        console.log('Connexion à MongoDB échouée !');
    }
})();

app.use(authentification);
app.get('/', (req, res) => {
    res.sendFile('main.html', { root: './views/pages' });
});

app.use('/a', alumetRender);
app.use('/portal', portal);
app.use('/dashboard', dashboard);
app.use('/alumet', alumet);
app.use('/auth', auth);
app.use('/profile', profile);

app.use('/swiftChat', swiftChat);
app.use('/mindFlash', mindFlash);

app.use('/preview', preview);
app.use('/viewer', viewer);

app.use('/cdn', uploader);
app.use('/preview', preview);

app.use('/api/wall', wall);
app.use('/api/post', post);
app.use('/api/notifications', notifications);

app.use('/api/homeworks', homeworks);
app.use('/api/board', board);

app.use('/openai/mindFlash', mindFlashAi);

const path = require('path');
app.get('*', async (req, res) => {
    const filePath = path.join(__dirname, './views/pages/404.html');
    res.sendFile(filePath);
});

module.exports = app;
