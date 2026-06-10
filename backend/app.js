import express, { urlencoded } from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import connectToSocket from "./src/controllers/socketManager.js";
const app = express();
import userRoutes from "./src/routes/users.routes.js";
import dotenv from "dotenv";
dotenv.config();

app.use(cors());
app.use(express.json({ limit: "40mb" }));
app.use(urlencoded({ limit: "40mb", extended: true }));
app.use("/api/v1/users", userRoutes);

const server = createServer(app);

// Socket.io initialize
const io = connectToSocket(server);

app.set("port", process.env.PORT || 3000);

const start = async () => {
  try {
    app.set("mongo_user");
    const connection = await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
    server.listen(app.get("port"), () => {
      console.log(`Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
