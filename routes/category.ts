import express from "express";

import controller from "../controllers/category";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/categories").get(verifyToken, controller.getCategories);

export default router;
