const Chat = require("../models/chat");
const HttpError = require("../models/http-error");
const Message = require("../models/message").Message;

const createChat = async (req, res, next) => {
  try {
    const existingChat = await Chat.findOne({
      $or: [
        {
          $and: [
            {
              user1: req.userData.userId,
            },
            { user2: req.body.secondUserId },
          ],
        },
        {
          $and: [
            {
              user2: req.body.secondUserId,
            },
            { user1: req.userData.userId },
          ],
        },
      ],
    });
    if (existingChat) {
      const error = new HttpError(
        "Chat already exists, can't have two chats with the same user.",
        404
      );
      return next(error);
    }

    const chat = new Chat({
      user1: req.userData.userId,
      user2: req.body.secondUserId,
      messages: [],
    });

    const savedChat = await chat.save();
    const populatedSavedChat = await savedChat
      .populate("user2", "firstName lastName")
      .execPopulate();
    res.status(200).json({ chat: populatedSavedChat });
  } catch (error) {
    next(error);
  }
};

const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
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
        {
          "messages.0": {
            $exists: true,
          },
        },
      ],
    });
    res.status(200).json({ chats });
  } catch (error) {
    return next(error);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      const error = new HttpError("Wrong chat id.", 401);
      return next(error);
    }

    if (
      !chat.user1.equals(req.userData.userId) &&
      !chat.user2.equals(req.userData.userId)
    ) {
      const error = new HttpError("Insufficient permissions.", 401);
      return next(error);
    }
    const message = new Message({
      text: req.body.text,
      sender: req.userData.userId,
    });
    chat.messages.push(message);
    await chat.save();
    res.status(200).json({ messsage: "Message sent", sentMessage: message });
  } catch (error) {
    return next(error);
  }
};

const fetchChatMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (
      !chat.user1.equals(req.userData.userId) &&
      !chat.user2.equals(req.userData.userId)
    ) {
      const error = new HttpError("Insufficient permissions.", 401);
      return next(error);
    }
    const messages = (await chat.populate("messages").execPopulate()).messages;
    res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
};

exports.fetchChatMessages = fetchChatMessages;
exports.createMessage = createMessage;
exports.getChats = getChats;
exports.createChat = createChat;
