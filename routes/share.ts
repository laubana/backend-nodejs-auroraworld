import express from "express";

import controller from "../controllers/share";
import verifyToken from "../middlewares/verifyToken";

const router = express.Router();

router.route("/share").post(verifyToken, controller.addShare);
router.route("/shares").post(verifyToken, controller.addShares);
router.route("/shares/:linkId").get(verifyToken, controller.getShares);
router.route("/share/:shareId").delete(verifyToken, controller.removeShare);
router.route("/share/:shareId").put(verifyToken, controller.updateShare);

export default router;
