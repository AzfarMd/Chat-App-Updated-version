const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const colors = require("colors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

//Reads raw HTTP request text and converts it into a JavaScript object attached to req.body.
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve frontend
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  // ONLY for development mode
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server started on port ${PORT}`.yellow.bold)
);

// Attaching socket.io to express server
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});


io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id); // 👈 KEY CONCEPT!
    socket.emit("connected");
  });
  // when user click on a chat,the socket enters that chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("UserJoined Room:" + room);
  });
  //typing showed on frontend as the other person is typing...
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("messages read", ({ room, userId }) => {
    socket.in(room).emit("messages read", { room, userId });
  });

  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  //when a new message is sent,it is emitted to all the users in the chat room
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    // Loop through all users in this chat:
    chat.users.forEach((user) => {
      // 1. If it's the sender, don't send it back to them
      if (user._id === newMessageReceived.sender._id) return;

      // 2. Push the message directly into each recipient's personal room!
      socket.in(user._id).emit("message recieved", newMessageReceived);
    });
  });


  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
//Method	Real-World Analogy	Who receives it?
//socket.emit("event", data)	Talking to yourself in a mirror	Only the single user who triggered the action.
//socket.in(room).emit("event", data)	Announcing over the loudspeaker in Room 101	Everyone inside that room, except the sender.
//io.emit("event", data)	Announcing over the entire city's speakers	Every single connected user across the entire website.