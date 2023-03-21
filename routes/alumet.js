const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    res.write('Hello World!' + req.params.id);
    res.end();
});

module.exports = router;