const jwt = require("jsonwebtoken");
const chatControllers = require("./controllers/chat-controllers");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const token = socket.handshake.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_KEY);

    if (userId) {
      socket.on("joinRoom", ({ roomId }) => {
        socket.join(roomId);
      });
      socket.on("leaveRoom", ({ roomId }) => {
        socket.leave(roomId);
      });
      socket.on("sendMessage", async ({ roomId, text }, callback) => {
        try {
          const message = await chatControllers.createMessage(
            userId,
            roomId,
            text
          );
          callback(message);
          socket.to(roomId).emit("message", { text, messageId: message._id });
        } catch (error) {
          callback({ error });
        }
      });
    }
  });
};
