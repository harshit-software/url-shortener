const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const ConnectToDB = require("../src/config/db");
const urlRoutes = require("../src/routes/urlRoutes");

ConnectToDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/", urlRoutes);

module.exports = app;
