require("dotenv").config({ path: "../backend/.env" });
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.ADMIN_PANEL_PORT || 5050;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Civix Admin Panel running at http://localhost:${PORT}`);
});
