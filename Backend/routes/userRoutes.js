import express from "express";
import {
  getProfile,
  updateProfile,
  deleteUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/profile").get(getProfile).put(updateProfile).delete(deleteUser);

export default router;
