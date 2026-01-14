import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllTweets,
    createTweet,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/")
    .get(getAllTweets)
    .post(createTweet)

router.route("/:tweetId")
    .patch(updateTweet)
    .post(deleteTweet)

export default router