import express from "express";

import controller from "../controllers/link";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/links").post(verifyToken, controller.addLink);
router.route("/links").get(verifyToken, controller.getLinks);
router.route("/links/:linkId").delete(verifyToken, controller.removeLink);
router.route("/links/:linkId").put(verifyToken, controller.updateLink);

export default router;
