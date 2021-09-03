const jwt = require("jsonwebtoken");
const chatControllers = require("./controllers/chat-controllers");
const User = require("./models/user");

const { Expo } = require("expo-server-sdk");

module.exports = (io) => {
  io.on("connection", (socket) => {
    try {
      const token = socket.handshake.headers.authorization.split(" ")[1];

      const userId = jwt.verify(token, process.env.JWT_KEY);

      const expo = new Expo();

      if (userId) {
        socket.join(userId);
        socket.on("joinRoom", ({ roomId }) => {
          socket.join(roomId);
        });
        socket.on("leaveRoom", ({ roomId }) => {
          socket.leave(roomId);
        });

        socket.on("sendMessage", async ({ roomId, text, token }, callback) => {
          try {
            const userId = jwt.verify(token, process.env.JWT_KEY).userId;

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
              sender: message.sender,
            });

            const { expoPushToken } = await User.findById(recieverId).select(
              "expoPushToken"
            );

            if (Expo.isExpoPushToken(expoPushToken.token)) {
              console.log("noti send");
              expo.sendPushNotificationsAsync([
                {
                  to: expoPushToken.token,
                  sound: "default",
                  body: text,
                  title:
                    message.sender.firstName + " " + message.sender.lastName,
                  priority: "high",
                  data: { type: "chatRoom", userId },
                },
              ]);
            }
          } catch (error) {
            callback({ error });
          }
        });
        socket.on(
          "addRoom",
          async ({ secondUserId, firstMessage, token }, callback) => {
            try {
              const userId = jwt.verify(token, process.env.JWT_KEY).userId;

              const { image, firstName, lastName } = await User.findById(
                userId
              ).select("image firstName lastName");

              const chat = await chatControllers.createChat(
                userId,
                secondUserId,
                firstMessage
              );

              callback({ chat });
              socket.to(secondUserId).emit("roomAdded", {
                roomId: chat._id,
                userId: userId,
                userImage: image,
                username: firstName + " " + lastName,
                messages: chat.messages,
              });
              const { expoPushToken } = await User.findById(
                secondUserId
              ).select("expoPushToken");
              if (Expo.isExpoPushToken(expoPushToken.token)) {
                console.log("noti send");
                expo.sendPushNotificationsAsync([
                  {
                    to: expoPushToken.token,
                    sound: "default",
                    body: firstMessage,
                    title: chat.user.firstName + " " + chat.user.lastName,
                    priority: "high",
                    data: { type: "chatRoom", userId },
                  },
                ]);
              }
            } catch (error) {
              console.log(error);
              callback({ error });
            }
          }
        );
      }
    } catch (e) {
      console.log(e);
    }
  });
};
