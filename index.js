/*
By using nodejs 20.9, write a simple chatroom by using socketio. Here are the requirements.
- The name of a participant can be self-defined using an input field. 
- participants can send text messages in the chatroom.
- participants can click either A/B/C/D button at anytime to indicate their current status.
- the A/B/C/D buttons should be located at the bottom, right below the text input field.
- the numbers of A/B/C/D and the number of active participants in the chatroom can be viewed in real time at the top of the chatroom.
- ensure no code injection can be implemented by santizing all text sent 
- the UI should be responsive and fits onto a smartphone
- Output the backend index.js file and the frontend HTML file 

*/

// index.js - Server-side code

const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const sanitizeHtml = require("sanitize-html");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 443;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Start server
server.listen(port, () => {
  console.log("Server is listening on port", port);
});

// Variables to keep track of users and statuses
let users = {}; // {socket.id: {name: 'User Name', status: 'A'}}
let statusCounts = { A: 0, B: 0, C: 0, D: 0 };

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Initialize user data
  users[socket.id] = { name: "Anonymous", status: null };

  // Update active participants count
  io.emit("participants count", Object.keys(users).length);

  // Send initial status counts
  io.emit("status counts", statusCounts);

  // Handle 'set name' event
  socket.on("set name", (name) => {
    // Sanitize name
    name = sanitizeHtml(name);
    users[socket.id].name = name;
    console.log("User set name:", name);
  });

  // Handle 'chat message' event
  socket.on("chat message", (msg) => {
    // Sanitize message
    msg = sanitizeHtml(msg);
    const name = users[socket.id].name;
    // Broadcast message to all clients
    io.emit("chat message", { name: name, message: msg });
  });

  // Handle 'status change' event
  socket.on("status change", (status) => {
    const previousStatus = users[socket.id].status;
    if (previousStatus) {
      // Decrement previous status count
      statusCounts[previousStatus]--;
    }
    // Update user's status
    users[socket.id].status = status;
    if (status && statusCounts.hasOwnProperty(status)) {
      // Increment new status count
      statusCounts[status]++;
    }
    // Broadcast updated status counts
    io.emit("status counts", statusCounts);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Decrement status count if user had a status
    const status = users[socket.id].status;
    if (status && statusCounts.hasOwnProperty(status)) {
      statusCounts[status]--;
    }
    // Remove user from users object
    delete users[socket.id];
    // Update active participants count
    io.emit("participants count", Object.keys(users).length);
    // Broadcast updated status counts
    io.emit("status counts", statusCounts);
  });
});
