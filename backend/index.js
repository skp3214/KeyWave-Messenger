import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/index.js";
import userRouter from "./routes/user.route.js";
import { Server } from "socket.io";
import http from "http";
import { RSAClient } from "e2ee-ts";

const app = express();
const port = process.env.PORT || 8000;

dotenv.config({ path: "./.env" });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

const onlineUsers = new Map(); // userId: socketId
const rsaClients = new Map(); // userId: RSAClient instance
const userDetails = new Map(); // userId: { username, fullName }

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", async ({ userId, username, fullName }) => {
    if (!userId) return;
    console.log(`User ${userId} (${username}) joined`);
    onlineUsers.set(userId, socket.id);
    userDetails.set(userId, { username, fullName });

    const rsaClient = new RSAClient();
    await rsaClient.init();
    rsaClients.set(userId, rsaClient);

    io.emit("onlineUsers", Array.from(userDetails.entries()).map(([id, details]) => ({
      userId: id,
      ...details,
    })));
  });

  socket.on("requestPublicKey", ({ fromUserId, toUserId }) => {
    const toSocketId = onlineUsers.get(toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit("publicKeyRequest", { fromUserId });
    }
  });

  socket.on("sharePublicKey", async ({ fromUserId, toUserId, approved }) => {
    if (approved) {
      const rsaClient = rsaClients.get(fromUserId);
      const toSocketId = onlineUsers.get(toUserId);
      if (rsaClient && toSocketId) {
        const publicKey = await rsaClient.exportPublicKey();
        io.to(toSocketId).emit("receivePublicKey", { fromUserId, publicKey });
      }
    }
  });

  socket.on("sendMessage", async ({ fromUserId, toUserId, message }) => {
    const senderRsaClient = rsaClients.get(fromUserId);
    const receiverRsaClient = rsaClients.get(toUserId);
    const toSocketId = onlineUsers.get(toUserId);
    const senderDetails = userDetails.get(fromUserId);

    if (senderRsaClient && receiverRsaClient && toSocketId && senderDetails) {
      const receiverPublicKey = await receiverRsaClient.exportPublicKey();
      const tempRsaClient = new RSAClient();
      await tempRsaClient.init();
      await tempRsaClient.importClientPublic(receiverPublicKey);

      const messageBuffer = new TextEncoder().encode(message);
      const encryptedMessage = await tempRsaClient.encrypt(messageBuffer);

      const decryptedBuffer = await receiverRsaClient.decrypt(encryptedMessage);
      const decryptedMessage = new TextDecoder().decode(decryptedBuffer);

      io.to(toSocketId).emit("receiveMessage", {
        fromUserId,
        fromUsername: senderDetails.username, 
        message: decryptedMessage,
      });
      io.to(onlineUsers.get(fromUserId)).emit("receiveMessage", {
        fromUserId,
        fromUsername: senderDetails.username, 
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        rsaClients.delete(userId);
        userDetails.delete(userId);
        io.emit("onlineUsers", Array.from(userDetails.entries()).map(([id, details]) => ({
          userId: id,
          ...details,
        })));
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!", err);
  });

export default app;