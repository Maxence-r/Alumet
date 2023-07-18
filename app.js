// Import librairies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { mongodbConnectString} = require('./config.json');
//Import middlewares
const authentification = require('./middlewares/authentification/authentification');
const anonymeAuthentification = require('./middlewares/authentification/anonymeAuthentification');
// Import routes
const dashboard = require('./routes/api/alumetGlobal/dashboard');
const uploader = require('./routes/api/alumetGlobal/uploader');
const alumet = require('./routes/api/alumet/alumet')
const auth = require('./routes/api/alumetGlobal/auth');
const portal = require('./routes/api/alumetGlobal/portal');
const alumetRender = require('./routes/routing/alumet');
const preview = require('./routes/utils/preview');

const homeworks = require('./routes/applications/eduTasker');
const board = require('./routes/applications/ideaFlow');

const wall = require('./routes/api/alumet/wall');
const post = require('./routes/api/alumet/post');
const notifications = require('./routes/api/alumet/notifications');
const conversation = require('./routes/applications/swiftChat');
// Definition des outils

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('./views'));
app.use(express.static('./cdn'));


// Connexion à la base de données
mongoose.set('strictQuery', true);
mongoose.connect(`${mongodbConnectString}`, 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


// Routes global
app.use(authentification);
app.get('/', (req, res) => {
    res.sendFile('main.html', {root: './views/pages'});
});
app.use('/404', (_, res) => {
    res.sendFile('404.html', {root: './views/pages'});
});

app.use('/project', (_, res) => {
    res.sendFile('project.html', {root: './views/pages'});
});

app.use('/update', (_, res) => {
    res.sendFile('update.html', {root: './views/pages'});
});

app.use('/adopter', (_, res) => {
    res.sendFile('why-adopt.html', {root: './views/pages'});
})

// Routes spécifiques
app.use('/a', anonymeAuthentification, alumetRender)
app.use('/portal', anonymeAuthentification, portal);
app.use('/dashboard', dashboard);
app.use('/alumet', alumet);
app.use('/auth', auth);
app.use('/conversation', conversation);

// preview processing 
app.use('/preview', preview)

// content delivery network
app.use('/cdn', uploader)
app.use('/preview', preview)
// routes api
app.use('/api/wall', wall);
app.use('/api/post', post); 
app.use('/api/notifications', notifications);

// routes moduless
app.use('/api/homeworks', homeworks)
app.use('/api/board', board)
module.exports = app;

