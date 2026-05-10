const generateCode = require("../utils/generateCode");
const Url = require("../models/Url");
const validator = require("validator");
const BASE_URL = process.env.BASE_URL;
const redisClient = require("../config/redis");
const generateQrCode = require("../utils/generateQRCodes");

const createUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias } = req.body;

    // Validate original URL
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    if (!validator.isURL(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    // Reserved aliases
    const reservedRoutes = ["api", "admin", "login", "register", "favicon.ico"];

    // Validate custom alias
    if (customAlias) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        return res.status(400).json({
          success: false,
          message:
            "Custom alias can only contain letters, numbers, hyphens, and underscores",
        });
      }

      if (reservedRoutes.includes(customAlias.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Alias is reserved",
        });
      }

      // Check alias uniqueness
      const existingAlias = await Url.findOne({
        shortCode: customAlias,
      });

      if (existingAlias) {
        return res.status(400).json({
          success: false,
          message: "Alias already taken",
        });
      }
    }

    // Generate unique short code
    let shortCode = customAlias;

    if (!shortCode) {
      let isUnique = false;

      while (!isUnique) {
        shortCode = generateCode();

        const existingCode = await Url.findOne({
          shortCode,
        });

        if (!existingCode) {
          isUnique = true;
        }
      }
    }

    // Create short URL
    const shortUrl = `${BASE_URL}/${shortCode}`;

    // Generate QR Code
    const qrCode = await generateQrCode(shortUrl);

    // Save to DB
    const newUrl = await Url.create({
      originalUrl,
      shortCode,
      qrCode,
    });

    // Cache full object in Redis
    await redisClient.set(
      `urlshortener:${shortCode}`,
      JSON.stringify(newUrl),
      "EX",
      3600,
    );

    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        originalUrl,
        shortUrl,
        shortCode,
        qrCode,
      },
    });
  } catch (error) {
    console.error(error);

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

    // Try cache first
    let cachedUrl = await redisClient.get(`urlshortener:${code}`);

    let urlData;

    // CACHE HIT
    if (cachedUrl) {
      urlData = JSON.parse(cachedUrl);

      // Increment Redis click counter
      await redisClient.incr(`urlshortener:clicks:${code}`);

      // Increment MongoDB clicks
      await Url.findOneAndUpdate({ shortCode: code }, { $inc: { clicks: 1 } });

      return res.redirect(urlData.originalUrl);
    }

    // CACHE MISS -> DATABASE
    const url = await Url.findOne({
      shortCode: code,
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    // Optional Expiration Check
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: "Short URL has expired",
      });
    }

    // Increment MongoDB clicks
    url.clicks += 1;

    await url.save();

    // Cache full object
    await redisClient.set(
      `urlshortener:${code}`,
      JSON.stringify({
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        qrCode: url.qrCode,
      }),
      "EX",
      3600,
    );

    // Redis click counter
    await redisClient.incr(`urlshortener:clicks:${code}`);

    return res.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { createUrl, redirectUrl };
