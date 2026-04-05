const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const DATA_FILE = path.join(__dirname, "data", "points.json");

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function writeData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

app.get("/api/points", (req, res) => {
  res.json(readData());
});

app.post("/api/points", (req, res) => {
  try {
    const newPoint = {
      id: Date.now().toString(),
      number: req.body.number,
      objectName: req.body.objectName,
      meterType: req.body.meterType,
      verificationDate: req.body.verificationDate,
      isControlled: req.body.isControlled === "on",
      createdAt: new Date().toISOString(),
    };

    const points = readData();
    points.push(newPoint);

    if (writeData(points)) {
      res.status(201).json({ success: true });
    } else {
      throw new Error("Write failed");
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/points/:id", (req, res) => {
  try {
    const points = readData();
    const filteredPoints = points.filter((p) => p.id !== req.params.id);

    if (writeData(filteredPoints)) {
      res.json({ success: true });
    } else {
      throw new Error("Write failed");
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер працює на http://localhost:${PORT}`);
});
