const authorize = (type) => {
    return async (req, res, next) => {
        /* 
        Professor: Check if the user is connected and if his account type is professor or staff
        Student: Check if the user is connected and if his account type is student or staff
        All: Check if the user is connected
        Staff: Check if the user is connected and if his account type is staff
        */
        if (type === "professor") {
            if (!req.connected || (req.user.accountType !== "professor" && req.user.accountType !== "staff")) {
                return res.status(401).json({ error: "Cette action ne peux pas être réaliser par votre compte (STUDENT account)" });
            }
        } else if (type === "student") {
            if (!req.connected || (req.user.accountType !== "student" && req.user.accountType !== "staff")) {
                return res.status(401).json({ error: "Unauthorized x002" });
            }
        } else if (type === "all") {
            if (!req.connected) {
                return res.status(401).json({ error: "Unauthorized x003" });
            }
        } else if (type === "staff") {
            if (!req.connected || req.user.accountType !== "staff") {
                return res.status(401).json({ error: "Unauthorized x004" });
            }
        }
        next();
    };
};

module.exports = authorize;
