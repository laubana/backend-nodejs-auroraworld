import express from "express";

import controller from "../controllers/link";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/links").post(verifyToken, controller.addLink);
router.route("/own-links").get(verifyToken, controller.getOwnLinks);
router.route("/shared-links").get(verifyToken, controller.getSharedLinks);
router.route("/links/:linkId").delete(verifyToken, controller.removeLink);

export default router;
