/////middle ware.. ///
const controller = require("../controller/userController");

const { isVerified, notVerified } = require("../middlewares/AgentMiddleware");

const { upload, processUploads } = require("../middlewares/upload");



const express = require("express");

const router = express.Router();

router.get("/", controller.homePage);

router.get("/lodges", controller.lodgePage);

router.get('/lodges/single/:id', controller.singlePage);

////post lodge////
router.get("/post-lodge", isVerified, controller.postLodgePage);

router.post("/api/lodges", isVerified, upload.array("media", 5), controller.postLodge);

// UPDATE
router.put("/api/lodges/:id", isVerified, upload.array("media", 5), controller.updateLodge);

router.put("/api/lodges/status/:id", isVerified, controller.updateStatus);

router.delete('/post-lodge/:id', isVerified, controller.deleteLodge);

router.get("/roommate", controller.roommatePage);



module.exports = router;

