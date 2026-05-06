const generateCode = require("../utils/generateCode");
const Url = require("../models/Url");
const base_url = `http://localhost:5000`;

const createUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Url is required" });
    }
    const shortCode = generateCode();
    const newUrl = await Url.create({ originalUrl, shortCode });
    res.json({ shortUrl: `${base_url}/${shortCode}` });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const url = await Url.findOne({ shortCode: code });
    if (!url) {
      return res.status(404).json({ success: false, message: "Url not found" });
    }

    url.clicks++;
    await url.save();
    res.redirect(url.originalUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { createUrl, redirectUrl };
