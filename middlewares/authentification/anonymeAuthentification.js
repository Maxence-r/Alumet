const jwt = require('jsonwebtoken');
require('dotenv').config();

const anonymeAuthentification = (req, res, next) => {
   if (!req.cookies.alumetToken) {
          req.auth = false;
          return next();
   } else {
         try {
              const decodedToken = jwt.verify(req.cookies.alumetToken, process.env.TOKEN.toString());
              req.auth = true;
              req.alumet = decodedToken;
              return next();
         } catch (error) {
              req.auth = false;
              return next();
         }
    }
    
};

module.exports = anonymeAuthentification;