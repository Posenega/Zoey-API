const Chat = require("../models/chat");
const HttpError = require("../models/http-error");
const Message = require("../models/message").Message;
const mongoose = require("mongoose");

const _filterChat = (chat, userId) => {
  const myChat = chat._doc;
  if (myChat.user1) {
    myChat.user = myChat.user1;
  }
  if (myChat.user2) {
    myChat.user = myChat.user2;
  }

  delete myChat.user1;
  delete myChat.user2;
  if (myChat.messages) {
    myChat.messages = myChat.messages.reverse().map((m) => {
      const message = m._doc;
      message.isMine = message.sender.equals(userId);
      delete message.sender;
      return message;
    });
  }
  return myChat;
};

const createChat = async (userId, secondUserId) => {
  try {
    const existingChat = await Chat.findOne({
      $or: [
        {
          $and: [
            {
              user1: userId,
            },
            { user2: secondUserId },
          ],
        },
        {
          $and: [
            {
              user2: secondUserId,
            },
            { user1: userId },
          ],
        },
      ],
    });
    if (existingChat) {
      const error = new HttpError(
        "Chat already exists, can't have two chats with the same user.",
        404
      );
      throw error;
    }

    const chat = new Chat({
      user1: userId,
      user2: secondUserId,
      messages: [],
    });

    const savedChat = await chat.save();
    const populatedSavedChat = await savedChat
      .populate("user2", "firstName lastName imageUrl")
      .execPopulate();
    console.log(populatedSavedChat);
    delete populatedSavedChat._doc.user1;
    populatedSavedChat._doc.user = populatedSavedChat._doc.user2;
    delete populatedSavedChat._doc.user2;

    return populatedSavedChat._doc;
  } catch (error) {
    throw error;
  }
};

const getChats = async (req, res, next) => {
  try {
    if (req.query.user || req.query._id) {
      let query;
      if (req.query.user) {
        const user = req.query.user;
        if (!mongoose.Types.ObjectId.isValid(user)) {
          const error = new HttpError("Please provide a valid user id.", 404);
          return next(error);
        }
        delete req.query.user;

        query = {
          $or: [
            {
              user2: req.userData.userId,
              user1: user,
            },
            {
              user2: user,
              user1: req.userData.userId,
            },
          ],
        };
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.query._id)) {
          const error = new HttpError("Please provide a valid chat id.", 404);
          return next(error);
        }
        query = {
          $and: [
            {
              _id: req.query._id,
            },
            {
              $or: [
                {
                  user1: req.userData.userId,
                },
                {
                  user2: req.userData.userId,
                },
              ],
            },
          ],
        };
      }
      const chat = await Chat.findOne(query);

      if (!chat) {
        const error = new HttpError("Couldn't find chat with that query.", 404);
        return next(error);
      }
      if (
        !chat.user1.equals(req.userData.userId) &&
        !chat.user2.equals(req.userData.userId)
      ) {
        const error = new HttpError("Insufficient permissions.", 401);
        return next(error);
      }
      const populatedChat = await chat
        .populate("user1", "firstName lastName imageUrl", {
          _id: { $ne: req.userData.userId },
        })
        .populate("user2", "firstName lastName imageUrl", {
          _id: { $ne: req.userData.userId },
        })
        .populate("messages")
        .execPopulate();
      res
        .status(200)
        .json({ chat: _filterChat(populatedChat, req.userData.userId) });
    } else {
      const chats = await Chat.find(
        {
          $and: [
            {
              $or: [
                {
                  user1: req.userData.userId,
                },
                {
                  user2: req.userData.userId,
                },
              ],
            },
            // {
            //   "messages.0": {
            //     $exists: true,
            //   },
            // },
          ],
        },
        { messages: { $slice: -1 } }
      )
        .populate("user1", "firstName lastName imageUrl", {
          _id: { $ne: req.userData.userId },
        })
        .populate("user2", "firstName lastName imageUrl", {
          _id: { $ne: req.userData.userId },
        });

      res.status(200).json({ chats: chats.map(_filterChat) });
    }
  } catch (error) {
    return next(error);
  }
};

const createMessage = async (userId, chatId, text) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new HttpError("Wrong chat id.", 401);
      throw error;
    }

    if (!chat.user1.equals(userId) && !chat.user2.equals(userId)) {
      const error = new HttpError("Insufficient permissions.", 401);
      throw error;
    }
    const message = new Message({
      text: text,
      sender: userId,
    });
    chat.messages.push(message);
    const savedChat = await chat.save();

    const latestMessage = await Message.populate(
      savedChat.messages[savedChat.messages.length - 1],
      { path: "sender", select: { firstName: 1, lastName: 1 } }
    );

    return {
      message: latestMessage,
      recieverId: chat.user1.equals(userId) ? chat.user2 : chat.user1,
    };
  } catch (error) {
    throw error;
  }
};

exports.createMessage = createMessage;
exports.getChats = getChats;
exports.createChat = createChat;
