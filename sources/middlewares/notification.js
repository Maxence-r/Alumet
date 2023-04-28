const Notification = require("../models/notification");
const Alumet = require("../models/alumet");

const notification = (action) => {
  return async (req, res, next) => {
    let user = "Anonyme";
    console.log(req.auth);
    if (req.logged) {
      user = req.user.prenom + " " + req.user.nom;
    } else if (req.auth) {
      user = req.alumet.username;
    }
    console.log(user);
    try {
      let alumet = await Alumet.findById(req.params.alumet);
      const newNotification = new Notification({
        action: action,
        owner: user,
        alumet: alumet._id,
      });
      newNotification.save();
      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};

module.exports = notification;
