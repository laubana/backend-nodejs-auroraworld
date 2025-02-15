import express from "express";

import controller from "../controllers/share";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/shares").post(verifyToken, controller.addShare);
// router.route("/links").get(verifyToken, controller.getOwnLinks);
router.route("/shares/:shareId").delete(verifyToken, controller.removeShare);

export default router;
