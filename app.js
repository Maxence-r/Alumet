const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const config = require("./config/env");
const logger = require("./utils/logger");
const { isApiRequest } = require("./utils/http");

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

const servalWidget =
    config.analytics.servalWidgetUrl && config.analytics.servalSiteId
        ? `<script async src="${config.analytics.servalWidgetUrl}" data-serval-site="${config.analytics.servalSiteId}"></script>`
        : "";

const injectServalWidget = html => {
    if (!servalWidget || html.includes("data-serval-site=") || !/<\/head>/i.test(html)) {
        return html;
    }

    return html.replace(/<\/head>/i, `    ${servalWidget}\n</head>`);
};

const resolveSendFilePath = (filePath, options = {}) => {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }

    return path.resolve(options.root || ".", filePath);
};

const setDevelopmentCacheHeaders = res => {
    if (config.isProduction) {
        return;
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
};

const staticAssetOptions = maxAge => ({
    maxAge: config.isProduction ? maxAge : 0,
    immutable: config.isProduction,
    setHeaders: setDevelopmentCacheHeaders,
});

// SECURITY
app.disable("x-powered-by");
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);
app.use(cookieParser());

app.use((req, res, next) => {
    const sendFile = res.sendFile.bind(res);

    res.sendFile = (filePath, options, callback) => {
        let sendFileOptions = options;
        let sendFileCallback = callback;

        if (typeof sendFileOptions === "function") {
            sendFileCallback = sendFileOptions;
            sendFileOptions = {};
        }

        const resolvedPath = resolveSendFilePath(filePath, sendFileOptions);

        if (path.extname(resolvedPath).toLowerCase() !== ".html") {
            return sendFile(filePath, sendFileOptions, sendFileCallback);
        }

        fs.readFile(resolvedPath, "utf8", (err, html) => {
            if (err) {
                if (sendFileCallback) {
                    return sendFileCallback(err);
                }

                return next(err);
            }

            setDevelopmentCacheHeaders(res);
            res.type("html").send(injectServalWidget(html));

            if (sendFileCallback) {
                sendFileCallback();
            }
        });
    };

    next();
});

app.use(
    express.json({
        limit: "1mb",
        verify: (req, res, buffer) => {
            if (req.originalUrl === "/payment/webhook") {
                req.rawBody = buffer;
            }
        },
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(config.paths.views, staticAssetOptions("1d")));
app.use(express.static(config.paths.cdn, staticAssetOptions("7d")));

mongoose.set("strictQuery", true);
const databaseConnection = (async () => {
    if (!config.database.uri) {
        logger.warn("MONGODB_URI is not configured. Database-backed routes will be unavailable.");
        return null;
    }

    try {
        await mongoose.connect(config.database.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info("MongoDB connection successful.");
        return mongoose.connection;
    } catch (err) {
        logger.error("MongoDB connection failed.", err);
        return null;
    }
})();

app.use(authentification);
app.get("/", (req, res) => {
    res.sendFile("main.html", { root: config.paths.pages });
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

app.get("*", async (req, res) => {
    if (isApiRequest(req)) {
        return res.status(404).json({ error: "Route not found" });
    }

    const filePath = path.join(config.paths.pages, "404.html");
    res.status(404).sendFile(filePath);
});

app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl}`, err);

    if (res.headersSent) {
        return next(err);
    }

    if (isApiRequest(req)) {
        return res.status(err.status || 500).json({ error: err.message || "Server error" });
    }

    return res.status(err.status || 500).sendFile(path.join(config.paths.pages, "404.html"));
});

app.set("databaseConnection", databaseConnection);

module.exports = app;
