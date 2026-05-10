const cron = require("node-cron");
const redisClient = require("../config/redis");
const Url = require("../models/Url");

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Syncing clicks...");

    let cursor = "0";

    do {
      // scan redis incrementally
      const reply = await redisClient.scan(
        cursor,
        "MATCH",
        "urlshortener:clicks:*",
        "COUNT",
        100,
      );

      cursor = reply[0];
      const keys = reply[1];

      if (keys.length === 0) continue;

      const bulkOperations = [];

      for (const key of keys) {
        const shortCode = key.split(":")[2];

        // atomic get + delete
        const clicks = await redisClient.getDel(key);

        if (!clicks) continue;

        bulkOperations.push({
          updateOne: {
            filter: { shortCode },
            update: {
              $inc: {
                clicks: Number(clicks),
              },
            },
          },
        });
      }

      // batch update mongodb
      if (bulkOperations.length > 0) {
        await Url.bulkWrite(bulkOperations);
      }
    } while (cursor !== "0");

    console.log("Clicks synced successfully");
  } catch (error) {
    console.error("Click sync failed:", error);
  }
});
