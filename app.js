// Import librairies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

//Import middlewares
const checkLogin = require('./middlewares/checkLogin');

// Import routes
const dashboard = require('./routes/dashboard');
const uploader = require('./routes/uploader');
const alumet = require('./routes/alumet')
const auth = require('./routes/auth');
const portal = require('./routes/portal');
const a = require('./routes/a');
// Definition des outils
app.use(cookieParser());
app.use(express.json());
app.use(express.static('./views'));
app.use(express.static('./cdn'));

// Connexion à la base de données
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://admin:OHdI4vfXbgNy1ZAV@alumet.knhvwib.mongodb.net/?retryWrites=true&w=majority', 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


// Routes
app.use(checkLogin);
app.get('/', (req, res) => {
    res.sendFile('main.html', {root: './views/pages'});
});
app.use('/404', (req, res) => {
    res.sendFile('404.html', {root: './views/pages'});
});
app.use('/a', a)
app.use('/portal', portal);
app.use('/dashboard', dashboard);
app.use('/alumet', alumet);
app.use('/auth', auth);
app.use('/cdn', uploader)


module.exports = app;

