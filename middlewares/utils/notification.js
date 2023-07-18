const Notification = require("../../models/notification");
const Alumet = require("../../models/alumet");

const notification = (action) => {
  return async (req, res, next) => {
    let user = "Anonyme";
    if (req.connected) {
      user = req.user.name + " " + req.user.lastname;
    } else if (req.auth) {
      user = req.alumet.username;
    }
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
