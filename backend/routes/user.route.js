import express from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    checkUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post(
    "/register",
    upload.fields([{ name: "profile", maxCount: 1 }]),
    (req, res, next) => {
        next();
    },
    registerUser
);

userRouter.route("/login").post(loginUser);

// secured routes
userRouter.route("/me").get(verifyJWT, checkUser)
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

export default userRouter;
