import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import compression from 'compression';
import morgan from 'morgan';

dotenv.config();

const app = express();

const authentification = require('../middlewares/authentification/authentification');
const admin = require('../routes/alumet/admin.js');
const dashboard = require('../routes/alumet/dashboard.js');
const profile = require('../routes/alumet/profile.js');
const uploader = require('../routes/files/uploader.js');
const alumet = require('../routes/applications/alumet/alumet.js');
const auth = require('../routes/alumet/auth.js');
const portal = require('../routes/alumet/portal.js');
const alumetRender = require('../routes/routing/app.js');
const preview = require('../routes/files/preview.js');
const viewer = require('../routes/files/viewer.js');
const stripe = require('../routes/payment/stripe.js');
const mail = require('../routes/mail/mail.js');
const legal = require('../routes/alumet/legal.js');
const homeworks = require('../routes/applications/tasker/eduTasker.js');
const mindmap = require('../routes/applications/mindmap/mindmap.js');
const flashcards = require('../routes/applications/flashcards/flashcards.js');
const swiftChat = require('../routes/applications/messenger/messenger.js');
const wall = require('../routes/applications/alumet/wall.js');
const post = require('../routes/applications/alumet/post.js');
const flashcardsAi = require('../routes/openai/flashcards');
const invitation = require('../routes/routing/invitation.js');
const rolloutExperiment = require('../middlewares/utils/rollout.js');

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve('./views')));
app.use(express.static(path.resolve('./cdn')));

mongoose.set('strictQuery', true);
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`, {
      useNewUrlParser: true as any,
      useUnifiedTopology: true as any,
    } as any);
    console.log('Connexion à MongoDB réussie !');
  } catch (err) {
    console.log('Connexion à MongoDB échouée !');
    console.log(err);
  }
})();

app.use(authentification);
app.get('/', (_req, res) => {
  res.sendFile('main.html', { root: './views/pages' });
});

rolloutExperiment('disableAlumet', '2024-08-12T18:01:30.000Z');

app.use('/portal', portal);
app.use('/alumet', alumet);
app.use('/auth', auth);
app.use('/profile', profile);
app.use('/mail', mail);
app.use('/legal', legal);
app.use('/admin', admin);

app.use('/swiftChat', swiftChat);
app.use('/flashcards', flashcards);
app.use('/mindmaps', mindmap);
app.use('/homeworks', homeworks);

app.use('/preview', preview);
app.use('/viewer', viewer);
app.use('/cdn', uploader);

app.use('/app', alumetRender);
app.use('/api/wall', wall);
app.use('/api/post', post);

app.use('/payment', stripe);

app.use('/openai/flashcards', flashcardsAi);

app.use('/dashboard', dashboard);
app.use('/invitation', invitation);

app.get('/philo', (_req, res) => {
  res.redirect('https://education.alumet.io/portal/65be34e467f994b25660ddbe');
});

app.get('*', async (_req, res) => {
  const filePath = path.join(__dirname, '../views/pages/404.html');
  res.sendFile(filePath);
});

export default app;

