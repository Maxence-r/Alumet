const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const Conversation = require("./models/conversation");

io.on("connection", (socket) => {
    socket.on("joinRoom", async (conversationId, userId) => {
        try {
            const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
            if (!conversation) {
                console.log(`User ${socket.id} attempted to join unauthorized room ${conversationId}`);
                return;
            }
            socket.join(conversationId);
            console.log(`User ${socket.id} joined room ${conversationId}`);
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("leaveRoom", (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left room ${conversationId}`);
    });

    socket.on("message", (message) => {
        console.log(`Message received on server: ${message.content}`);
        io.to(message.conversationId).emit("message", message);
    });
});

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
