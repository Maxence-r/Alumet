const jwt = require('jsonwebtoken');
const { tokenC } = require('../../config.json');


const alumetAuth = (req, res, next) => {
   if (!req.cookies.alumetToken) {
       req.auth = false;
       return next();
   } else {
         try {
              const decodedToken = jwt.verify(req.cookies.alumetToken, tokenC);
              req.auth = true;
              req.alumet = decodedToken;
              return next();
         } catch (error) {
              req.auth = false;
              return next();
         }
    }
    
};

module.exports = alumetAuth;