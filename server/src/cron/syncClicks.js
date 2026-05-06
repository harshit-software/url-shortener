const cron = require("node-cron");
const redisClient = require("../config/redis");
const Url = require("../models/Url");

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Syncing clicks...");

    // get all click keys
    const keys = await redisClient.keys("urlshortener:clicks:*");

    for (const key of keys) {
      // extract shortcode
      const shortCode = key.split(":")[2];

      // get click count
      const clicks = await redisClient.get(key);

      if (!clicks) continue;

      // update mongodb
      await Url.findOneAndUpdate(
        { shortCode },
        {
          $inc: {
            clicks: Number(clicks),
          },
        },
      );

      // reset redis counter
      await redisClient.del(key);
    }

    console.log("Clicks synced");
  } catch (error) {
    console.log(error);
  }
});
