import express from "express";

import controller from "../controllers/user";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/users").get(verifyToken, controller.getUsers);

export default router;
