const mongoose = require("mongoose");
const ConnectToDB = async () => {
  try {
    await mongoose
      .connect(process.env.MONGO_URI)
      .then(console.log("Connected to MongoDB Database"));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = ConnectToDB;
