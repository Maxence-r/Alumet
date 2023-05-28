const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const Alumet = require('../models/alumet');
require('dotenv').config();
const validateObjectId = require('../middlewares/validateObjectId');
const puppeteer = require('puppeteer');

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        if (req.logged) {
            const alumet = await Alumet.findOne({
                _id: req.params.id
            });
            if (!alumet) {
                return res.redirect('/404');
            }
            if (alumet.owner.toString() === req.user.id) {
                res.clearCookie('alumetToken');
                return res.redirect('/a/edit/' + req.params.id)
            }
        }
        if (req.auth && req.alumet.id.toString() === req.params.id) {
            return res.redirect('/a/' + req.params.id);
        }
        const filePath = path.join(__dirname, '../views/pages/authentication.html');
        return res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


router.post('/authorize', validateObjectId, async (req, res) => {
    Alumet.findOne({
        _id: req.body.id
    }).then(alumet => {
        if (!alumet) {
            return res.status(404).json({
                error: 'Alumet not found'
            });
        }
        if (req.body.username.length > 40 || req.body.username.includes('<')) {
            return res.status(400).json({
                error: 'Choississez un nom d\'utilisateur plus court !'
            });
        }
        if (alumet.password === req.body.password || !alumet.password) {
            const token = jwt.sign({
                id: alumet._id,
                username: req.body.username || "Anonyme",
            }, process.env.TOKEN.toString());
            res.cookie('alumetToken', token).status(200).json({
                message: 'Connexion réussie !'
            });
        } else {
            res.status(401).json({
                error: 'Mot de passe incorrect !'
            });
        }
    }).catch(error => {
        res.status(500).json({
            error
        });
    });
});



/* Nous devons trouver une solution légal, ceci était une expérimentation 

router.post('/educonnect', async (req, res) => {
    const {
        username,
        password
    } = req.body;
    const browser = await puppeteer.launch({
        headless: false
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://educonnect.education.gouv.fr/');

        await page.waitForSelector('#bouton_eleve');
        await page.click('#bouton_eleve');

        await page.waitForSelector('#username');
        await page.type('#username', username);
        await page.type('#password', password);

        await page.click('#bouton_valider');
      
        await page.waitForNavigation({waitUntil: 'networkidle0'});
        
        if (page.url() !== 'https://teleservices.education.gouv.fr/eds/') {
            return res.status(401).send('Invalid credentials');
        }
        
        const userResponse = await page.waitForResponse('https://teleservices.education.gouv.fr/eds/api/v0/user');
        const user = await userResponse.json();
        console.log(user);
        await page.waitForNavigation();
        return res.status(200).json(user);
        
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    } finally {
        await browser.close();
    }
});
*/



module.exports = router;