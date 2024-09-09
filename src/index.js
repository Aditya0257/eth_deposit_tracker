import express from "express";
import path from "path";
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.post("/txntracker", (req, res) => {
  notificationReceived(req);
  res.status(200).end();
});

app.get("/*", (req, res) => {
  res.json({
    "message": "Server is running!",
    "success": true
  })
  // res.sendFile(path.join(__dirname, "index.html"));
});

const server = createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

function notificationReceived(req) {
  console.log("Notification received!");
  io.emit("notification", JSON.stringify(req.body));
}

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
