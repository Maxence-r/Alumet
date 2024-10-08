const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const helmet = require("helmet");

const authentification = require("./middlewares/authentification/authentification");
const admin = require("./routes/alumet/admin.js");

const dashboard = require("./routes/alumet/dashboard.js");
const profile = require("./routes/alumet/profile.js");
const uploader = require("./routes/files/uploader.js");
const alumet = require("./routes/applications/alumet/alumet.js");
const auth = require("./routes/alumet/auth.js");
const portal = require("./routes/alumet/portal.js");
const alumetRender = require("./routes/routing/app.js");
const preview = require("./routes/files/preview.js");
const viewer = require("./routes/files/viewer.js");
const stripe = require("./routes/payment/stripe.js");
const mail = require("./routes/mail/mail.js");
const legal = require("./routes/alumet/legal.js");

const homeworks = require("./routes/applications/tasker/eduTasker.js");
const mindmap = require("./routes/applications/mindmap/mindmap.js");
const flashcards = require("./routes/applications/flashcards/flashcards.js");
const swiftChat = require("./routes/applications/messenger/messenger.js");

const wall = require("./routes/applications/alumet/wall.js");
const post = require("./routes/applications/alumet/post.js");

const flashcardsAi = require("./routes/openai/flashcards");
const invitation = require("./routes/routing/invitation.js");

// SECURITY
app.disable("x-powered-by");
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(cookieParser());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./views"));
app.use(express.static("./cdn"));

mongoose.set("strictQuery", true);
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connexion à MongoDB réussie !");
    } catch (err) {
        console.log("Connexion à MongoDB échouée !");
        console.log(err);
    }
})();

app.use(authentification);
app.get("/", (req, res) => {
    res.sendFile("main.html", { root: "./views/pages" });
});

// ROLLOUT
const rolloutExperiment = require("./middlewares/utils/rollout.js");
rolloutExperiment("disableAlumet", "2024-08-12T18:01:30.000Z");

// Alumet application
app.use("/portal", portal);
app.use("/alumet", alumet);
app.use("/auth", auth);
app.use("/profile", profile);
app.use("/mail", mail);
app.use("/legal", legal);
app.use("/admin", admin);

// Applications
app.use("/swiftChat", swiftChat);
app.use("/flashcards", flashcards);
app.use("/mindmaps", mindmap);
app.use("/homeworks", homeworks);

// Files related
app.use("/preview", preview);
app.use("/viewer", viewer);
app.use("/cdn", uploader);

// Alumet API
app.use("/app", alumetRender);
app.use("/api/wall", wall);
app.use("/api/post", post);

// Payment related
app.use("/payment", stripe);

// Ai related
app.use("/openai/flashcards", flashcardsAi);

// Dashboard related
app.use("/dashboard", dashboard);
app.use("/invitation", invitation);

app.get("/philo", (req, res) => {
    res.redirect("https://education.alumet.io/portal/65be34e467f994b25660ddbe");
});

const path = require("path");
app.get("*", async (req, res) => {
    const filePath = path.join(__dirname, "/views/pages/404.html");
    res.sendFile(filePath);
});

module.exports = app;
