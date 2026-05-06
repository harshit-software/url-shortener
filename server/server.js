const app = require("./src/app");
const PORT = process.env.PORT || 5000;
const base_url = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Server is running on ${base_url}`);
});
