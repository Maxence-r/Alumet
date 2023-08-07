const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const Conversation = require("./models/conversation");
const Account = require("./models/account");
const Message = require("./models/message");

io.on("connection", (socket) => {
    socket.on("joinRoom", async (conversationId, userId) => {
        try {
            const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
            if (!conversation) {
                console.log(`User ${socket.id} attempted to join unauthorized room ${conversationId}`);
                return;
            }
            socket.join(conversationId);
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("leaveRoom", (conversationId) => {
        socket.leave(conversationId);
    });

    socket.on("message", async (conversationId, messageId, userId) => {
        try {
            const conversation = await Conversation.findOne({ _id: conversationId });
            if (!conversation) {
                console.log(`User ${socket.id} attempted to send message to unauthorized room ${conversationId}`);
                return;
            }
            const user = await Account.findOne({ _id: userId }, { name: 1, lastname: 1, icon: 1, isCertified: 1, accountType: 1 });
            const message = await Message.findOne({ _id: messageId });
            const messageObject = { message, user };
            io.to(conversationId).emit("message", messageObject);
        } catch (error) {
            console.error(error);
        }
    });
});

global.io = io;
module.exports = io;

const normalizePort = (val) => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const errorHandler = (error) => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === "string" ? "pipe " + address : "port: " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges.");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use.");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

server.on("error", errorHandler);
server.on("listening", () => {
    const address = server.address();
    const bind = typeof address === "string" ? "pipe " + address : "port " + port;
    console.log("Serveur prêt sur le port: " + bind);
});

server.listen(port);

module.exports = server;
