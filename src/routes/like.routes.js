import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/:videoId").post(toggleVideoLike)
router.route("/:commentId").post(toggleCommentLike)
router.route("/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos)

export default router