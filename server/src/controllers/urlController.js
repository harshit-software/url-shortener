const generateCode = require("../utils/generateCode");
const Url = require("../models/Url");
const validator = require("validator");
const BASE_URL = process.env.BASE_URL;
const redisClient = require("../config/redis");
const generateQrCode = require("../utils/generateQRCodes");

const createUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Url is required" });
    }
    if (!validator.isURL(originalUrl)) {
      return res
        .status(400)
        .json({ success: false, message: "Not a valid URL" });
    }

    const existing = await Url.findOne({ originalUrl });
    if (existing) {
      return res.json({ shortUrl: `${BASE_URL}/${existing.shortCode}` });
    }
    const shortCode = generateCode();
    const qrCode = await generateQrCode(`${BASE_URL}/${shortCode}`);
    const newUrl = await Url.create({ originalUrl, shortCode, qrCode });

    await redisClient.set(`urlshortener:${shortCode}`, originalUrl, "EX", 3600);
    res.json({ shortUrl: `${BASE_URL}/${shortCode}` });
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
    let originalUrl = await redisClient.get(`urlshortener:${code}`);

    // CACHE HIT
    if (originalUrl) {
      // increment clicks in redis
      await redisClient.incr(`urlshortener:clicks:${code}`);

      return res.redirect(originalUrl);
    }
    // CACHE MISS -> CHECK DATABASE
    const url = await Url.findOne({
      shortCode: code,
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Url not found",
      });
    }

    originalUrl = url.originalUrl;

    // STORE IN REDIS
    await redisClient.set(`urlshortener:${code}`, originalUrl, "EX", 3600);

    // CLICK COUNTER
    await redisClient.incr(`urlshortener:clicks:${code}`);

    return res.redirect(originalUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { createUrl, redirectUrl };
