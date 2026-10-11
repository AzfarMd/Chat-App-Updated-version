const asyncHandler = require("express-async-handler");
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    //var newm create the message document
    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        readBy: [req.user._id], // 👈 Sender automatically marked as read
    };
    try {
        var message = await Message.create(newMessage);
        //populate sender name and avatar
        message = await message.populate("sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });
        //update the parent chat with the latest message
        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message,
        });

        res.json(message);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(400);
        throw new Error(error.message);
    }
});
//when we serch for a chat,it matches the req with the chatid and and return the latest chates 1st
const allMessages = asyncHandler(async (req, res) => {
    try {
        // 1. Mark all messages in this chat as read by the current user
        await Message.updateMany(
            { chat: req.params.chatId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );

        // 2. Fetch the messages with populated readBy
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email")
            .populate("chat");

        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { sendMessage, allMessages };
