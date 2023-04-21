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
const preview = require('./routes/preview');


const wall = require('./routes/api/wall');
const post = require('./routes/api/post');
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

// preview processing 
app.use('/preview', preview)

// content delivery network
app.use('/cdn', uploader)

// routes api
app.use('/api/wall', wall);
app.use('/api/post', post); 


var pdf2img = require('pdf-img-convert');
var path = require('path');
var fs = require('fs');
app.get('/preview', async (req, res) => {
    try {
      const url = req.query.url;
      if (!url) {
        throw new Error('URL parameter missing');
      }
  
      const outputImages = await pdf2img.convert(url, {width: 200});
      if (outputImages.length === 0) {
        throw new Error('No images found');
      }
  
      const outputImage = outputImages[0];
      const outputFile = 'output.png';
      const outputPath = path.join(__dirname, outputFile);
      fs.writeFileSync(outputPath, outputImage);
  
      res.sendFile(outputFile, { root: __dirname });
    } catch (error) {
      console.error(`Error generating image: ${error}`);
      res.status(500).send('Error generating image');
    }
  });


  const { exec } = require('child_process');

// Route to handle file preview requests
app.get('/preview/m', (req, res) => {
  const filename = req.query.url;
  const extension = path.extname(filename);

  // Check if file extension is supported
  if (extension === '.pptx' || extension === '.odt' || extension === '.ods' || extension === '.ppt' || extension === '.odp' || extension === '.docx' || extension === '.doc' || extension === '.xlsx' || extension === '.xls') {
    // Create a temporary directory to store the preview image
    const tempDir = path.join(__dirname, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate a preview image using LibreOffice command line tool
    const inputFile = path.join(__dirname, 'uploads', filename);
    const outputFile = path.join(tempDir, `${filename}.jpg`);
    exec(`libreoffice --headless --convert-to jpg --outdir ${tempDir} ${inputFile}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing LibreOffice command: ${error}`);
        res.status(500).send('Internal Server Error');
      } else {
        // Send the preview image back to the client
        res.sendFile(outputFile);
      }
    });
  } else {
    res.status(400).send('Unsupported file extension');
  }
});


module.exports = app;

