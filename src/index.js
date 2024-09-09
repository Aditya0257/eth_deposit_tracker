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

  console.log(req.body);

  // console.log("______________Body Activity o/p");
  // console.log(req.body.event.activity);
  // const arr = req.body.event.activity;
  // for (let i = 0; arr.length; i++) {
  //   console.log(arr[i]);
  //   console.log(" object's Log's topic =>");
  //   let topics = arr[i].log.topics;
  //   console.log(topics);
  //   console.log("INDIVIDUAL TOPCIS DATA =>");
  //   for (let j = 0; j < topics.length; j++) {
  //     console.log(topics[j]);
  //   }
  //   console.log("This iteration ends!");
  // }
  res.status(200).end();
});

app.get("/*", (req, res) => {
  res.json({
    message: "Server is running!",
    success: true,
  });
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
