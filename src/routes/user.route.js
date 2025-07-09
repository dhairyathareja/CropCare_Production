import express from "express";
import { askQuestion, detetctDisease } from "../controllers/user.controller.js";
import upload from "../utils/Multer.js"

const router = express.Router();

router.post('/chatBot',askQuestion);
router.post('/detectDisease',upload.single("image"),detetctDisease);


export default router;
