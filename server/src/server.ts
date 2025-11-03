import express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Server running successfully!");
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
