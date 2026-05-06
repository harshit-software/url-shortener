const express = require("express");
const router = express.Router();
const { createUrl, redirectUrl } = require("../controllers/urlController");

router.post("/", createUrl);
router.get("/:code", redirectUrl);

module.exports = router;
