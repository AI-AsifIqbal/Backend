import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllComments,
    makeComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";

const router = new Router()
router.use(verifyJWT)

router.route("/:videoId")
    .get(getAllComments)
    .post(makeComment)

router.route("/:videoId/:commentId")
    .patch(updateComment)
    .post(deleteComment)

export default router