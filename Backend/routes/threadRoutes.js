import express from "express";
import {
  getAllThreads,
  getThreadById,
  renameThread,
  deleteThread,
  handleChat,
} from "../controllers/threadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getAllThreads);

router
  .route("/:threadId")
  .get(getThreadById)
  .patch(renameThread)
  .delete(deleteThread);

router.route("/chat").post(handleChat);

export default router;
