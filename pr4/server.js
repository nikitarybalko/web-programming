const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

const cors = require("cors");
app.use(cors());

let capacitorBanks = [
  {
    id: 1,
    name: "Підстанція №1",
    ratedPower: 150,
    activePower: 100,
    stepsCount: 6,
    activeSteps: 4,
    voltage: 0.4,
    powerFactor: 0.95,
  },
  {
    id: 2,
    name: "Підстанція №2",
    ratedPower: 900,
    activePower: 450,
    stepsCount: 6,
    activeSteps: 3,
    voltage: 10.0,
    powerFactor: 0.92,
  },
];

// 1. GET - отримати всі установки (з можливістю фільтрації за напругою)
app.get("/api/capacitor-banks", (req, res) => {
  const { voltage } = req.query;
  if (voltage) {
    const filtered = capacitorBanks.filter(
      (bank) => bank.voltage === parseFloat(voltage),
    );
    return res.json(filtered);
  }
  res.json(capacitorBanks);
});

// 2. GET - отримати конкретну установку за ID
app.get("/api/capacitor-banks/:id", (req, res) => {
  const bank = capacitorBanks.find((b) => b.id === parseInt(req.params.id));

  if (!bank) {
    return res
      .status(404)
      .json({ error: "Конденсаторну установку не знайдено" });
  }

  res.json(bank);
});

// 3. POST - створити нову установку
app.post("/api/capacitor-banks", (req, res) => {
  const { name, ratedPower, stepsCount, voltage } = req.body;

  if (!name || !ratedPower || !stepsCount || !voltage) {
    return res.status(400).json({
      error: "Відсутні обов'язкові поля",
      required: ["name", "ratedPower", "stepsCount", "voltage"],
    });
  }

  const newBank = {
    id:
      capacitorBanks.length > 0
        ? Math.max(...capacitorBanks.map((b) => b.id)) + 1
        : 1,
    name,
    ratedPower,
    activePower: req.body.activePower || 0,
    stepsCount,
    activeSteps: req.body.activeSteps || 0,
    voltage,
    powerFactor: req.body.powerFactor || 1.0,
  };

  capacitorBanks.push(newBank);
  res.status(201).json(newBank);
});

// 4. PUT - повне оновлення установки
app.put("/api/capacitor-banks/:id", (req, res) => {
  const index = capacitorBanks.findIndex(
    (b) => b.id === parseInt(req.params.id),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Установку не знайдено" });
  }

  capacitorBanks[index] = {
    id: parseInt(req.params.id),
    ...req.body,
  };

  res.json(capacitorBanks[index]);
});

// 5. PATCH - часткове оновлення
app.patch("/api/capacitor-banks/:id", (req, res) => {
  const index = capacitorBanks.findIndex(
    (b) => b.id === parseInt(req.params.id),
  );

  if (index === -1) {
    return res
      .status(404)
      .json({ error: "Конденсаторну установку не знайдено" });
  }

  capacitorBanks[index] = {
    ...capacitorBanks[index],
    ...req.body,
    id: parseInt(req.params.id),
  };

  // автоматичний перерахунок activePower, якщо змінилися ступені
  if (req.body.activeSteps !== undefined) {
    const stepPower =
      capacitorBanks[index].ratedPower / capacitorBanks[index].stepsCount;
    capacitorBanks[index].activePower =
      stepPower * capacitorBanks[index].activeSteps;
  }

  res.json(capacitorBanks[index]);
});

// 6. DELETE - видалити установку
app.delete("/api/capacitor-banks/:id", (req, res) => {
  const index = capacitorBanks.findIndex(
    (b) => b.id === parseInt(req.params.id),
  );

  if (index === -1) {
    return res
      .status(404)
      .json({ error: "Конденсаторну установку не знайдено" });
  }

  const deletedBank = capacitorBanks.splice(index, 1);
  res.json({
    message: "Конденсаторну установку успішно видалено",
    deleted: deletedBank[0],
  });
});

app.listen(PORT, () => {
  console.log(`API Сервер запущено на http://localhost:${PORT}`);
});
