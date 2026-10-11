const expressAsyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } }, // ✅ FIXED typo `$eleMatch` → `$elemMatch`
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // Create chat if not exists
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = expressAsyncHandler(async (req, res) => {
  try {
    let results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } }) // ✅ FIXED: `req_user` → `req.user`
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    //-1 makes the updated msg to appear on top of the msg
    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(results);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = expressAsyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res.status(400).send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users,
      isGroupChat: true,
      groupAdmin: [req.user],
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // 1. Fetch the chat first to check admins
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  // 2. Check if the logged-in user (req.user._id) is in the groupAdmin array
  const isAdmin = chat.groupAdmin.some(
    (adminId) => adminId.toString() === req.user._id.toString()
  );

  if (!isAdmin) {
    res.status(403);
    throw new Error("Only admins can add members!");
  }

  // 3. If admin, proceed to add the user
  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(added);
});


const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // 1. Fetch chat to check permissions
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  // 2. Allow if leaving yourself OR if you are an admin
  const isLeavingThemselves = userId.toString() === req.user._id.toString();
  const isAdmin = chat.groupAdmin.some(
    (adminId) => adminId.toString() === req.user._id.toString()
  );

  if (!isLeavingThemselves && !isAdmin) {
    res.status(403);
    throw new Error("Only admins can remove someone!");
  }

  // 3. Remove user from both 'users' and 'groupAdmin' arrays
  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId, groupAdmin: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(removed);
});


module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
