const app = require("./src/app");
const ConnectToDB = require("../server/src/config/db");
ConnectToDB();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL;

app.listen(PORT, () => {
  console.log(`Server is running on ${BASE_URL}`);
});
