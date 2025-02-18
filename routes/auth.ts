import express from "express";

import controller from "../controllers/auth";

const router = express.Router();

router.route("/refresh").get(controller.refresh);
router.route("/sign-in").post(controller.signIn);
router.route("/sign-out").post(controller.signOut);
router.route("/sign-up").post(controller.signUp);

export default router;
