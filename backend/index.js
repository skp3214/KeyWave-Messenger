import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/index.js";
import userRouter from "./routes/user.route.js";

const app = express();
const port = process.env.PORT || 8080;

dotenv.config({ path: "./.env" });

app.use(
    cors({
        origin: process.env.CORS_PARTICULAR_ORIGIN,
        credentials: true, 
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.options(process.env.CORS_ORIGIN, cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes declaration
app.use("/api/v1/users", userRouter);

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on: http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed!", err);
    });
