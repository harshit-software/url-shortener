const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const urlRoutes = require("./routes/urlRoutes");
require("../src/cron/syncClicks");

const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use("/", urlRoutes);

module.exports = app;
