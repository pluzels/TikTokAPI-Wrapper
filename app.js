const express = require("express");
const path = require("path");
const { SSSTik } = require("./ssstik");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/download", async (req, res) => {
  const { url } = req.body;

  try {
    const result = await SSSTik(url);
    if (result.status === "success") {
      res.json(result.result);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to download content." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
