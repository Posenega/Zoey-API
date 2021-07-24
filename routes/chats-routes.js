const router = require("express").Router();
const checkAuth = require("../middleware/check-auth");

const chatControllers = require("../controllers/chat-controllers");

router.use(checkAuth);

router.post("/", chatControllers.createChat);

router.get("/", chatControllers.getChats);

router.post("/:chatId/messages", chatControllers.createMessage);

module.exports = router;
