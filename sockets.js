const jwt = require("jsonwebtoken");
const chatControllers = require("./controllers/chat-controllers");

const { Expo } = require("expo-server-sdk");

const usersExpoPushTokens = [];

module.exports = (io) => {
  io.on("connection", (socket) => {
    try {
      const { expoPushToken } = socket.handshake.query;
      const token = socket.handshake.headers.authorization.split(" ")[1];
      const { userId } = jwt.verify(token, process.env.JWT_KEY);
      usersExpoPushTokens.push({ userId, expoPushToken });
      const expo = new Expo();

      if (userId) {
        socket.on("joinRoom", ({ roomId }) => {
          socket.join(roomId);
        });
        socket.on("leaveRoom", ({ roomId }) => {
          socket.leave(roomId);
        });
        socket.on("subscribe", ({ userId }) => {
          socket.join(userId);
        });
        socket.on("unsubscribe", ({ userId }) => {
          socket.leave(userId);
        });
        socket.on("sendMessage", async ({ roomId, text }, callback) => {
          try {
            const { message, recieverId } = await chatControllers.createMessage(
              userId,
              roomId,
              text
            );

            callback({ message });
            socket.to(roomId).emit("message", {
              text,
              messageId: message._id,
              createdAt: message.createdAt,
            });

            const recievedUserExpoPushToken = usersExpoPushTokens.find(
              (userExpoPushToken) => recieverId.equals(userExpoPushToken.userId)
            )?.expoPushToken;

            if (Expo.isExpoPushToken(expoPushToken)) {
              console.log("noti send");
              expo.sendPushNotificationsAsync([
                {
                  to: expoPushToken,
                  sound: "default",
                  body: text,
                  title:
                    message.sender.firstName + " " + message.sender.lastName,
                },
              ]);
            }
          } catch (error) {
            callback({ error });
          }
        });
        socket.on("addRoom", async ({ secondUserId }, callback) => {
          try {
            const chat = await chatControllers.createChat(userId, secondUserId);
            callback({ chat });
            socket.to(secondUserId).emit("roomAdded", {
              roomId: chat._id,
              userId: chat.user._id,
              userImageUrl: chat.user.imageUrl,
              username: chat.user.firstName + "" + chat.user.lastName,
            });
          } catch (error) {
            callback({ error });
          }
        });
        socket.on("disconnect", () => {
          usersExpoPushTokens.filter(
            (userExpoPushToken) => userExpoPushToken.userId !== userId
          );
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
};
