// Import librairies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Import routes
const dashboard = require('./routes/dashboard');
const root = require('./routes/root');
const alumet = require('./routes/alumet')
const auth = require('./routes/auth');
// Definition des outils
app.use(cookieParser());
app.use(express.json());
app.use(express.static('./views'));

// Connexion à la base de données
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://admin:OHdI4vfXbgNy1ZAV@alumet.knhvwib.mongodb.net/?retryWrites=true&w=majority', 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


// Routes
app.get('/', root);
app.use('/dashboard', dashboard);
app.use('/alumet', alumet);
app.use('/auths', auth);

module.exports = app;

