import express from "express";

import controller from "../controllers/share";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/shares").post(verifyToken, controller.addShare);
router.route("/shares/:linkId").get(verifyToken, controller.getShares);
router.route("/shares/:shareId").delete(verifyToken, controller.removeShare);
router.route("/shares/:shareId").put(verifyToken, controller.updateShare);

export default router;
