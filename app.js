// Import librairies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const { mongodbConnectString} = require('./config.json');
//Import middlewares
const authentication = require('./middlewares/authentication');
const alumetAuth = require('./middlewares/api/alumetAuth');
// Import routes
const dashboard = require('./routes/dashboard');
const uploader = require('./routes/uploader');
const alumet = require('./routes/alumet')
const auth = require('./routes/auth');
const portal = require('./routes/portal');
const a = require('./routes/a');

const wall = require('./routes/api/wall');
const post = require('./routes/api/post');
// Definition des outils
app.use(cookieParser());
app.use(express.json());
app.use(express.static('./views'));
app.use(express.static('./cdn'));

// Connexion à la base de données
mongoose.set('strictQuery', true);
mongoose.connect(`${mongodbConnectString}`, 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


// Routes global
app.use(authentication);
app.get('/', (req, res) => {
    res.sendFile('main.html', {root: './views/pages'});
});
app.use('/404', (req, res) => {
    res.sendFile('404.html', {root: './views/pages'});
});

// Routes spécifiques
app.use('/a', alumetAuth, a)
app.use('/portal', alumetAuth, portal);
app.use('/dashboard', dashboard);
app.use('/alumet', alumet);
app.use('/auth', auth);
app.use('/cdn', uploader)

// routes api
app.use('/api/wall', wall);
app.use('/api/post', post); 


module.exports = app;

