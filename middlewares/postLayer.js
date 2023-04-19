const postLayer = (req, res, next) => {
    console.log("Body: ", req.body);
    if (req.body.title == '' && req.body.content == '' && !req.body.option) {
        res.json({ error: 'Vous n\'avez pas spécifié de titre, de contenu ou d\'option' });
    }
    next();
};

module.exports = postLayer;