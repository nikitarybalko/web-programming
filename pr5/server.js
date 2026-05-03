const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket сервер геотермальної станції запущено на порту 8080");

function generateGeothermalData() {
  const simulatedEntropy = 2.5 + (Math.random() - 0.5) * 0.2;

  return {
    timestamp: Date.now(),
    temperature: 200 + (Math.random() - 0.5) * 15,
    pressure: 15 + (Math.random() - 0.5) * 2,
    power: 25 + (Math.random() - 0.5) * 4,
    flowRate: 120 + (Math.random() - 0.5) * 10,
    efficiency: 18 + (Math.random() - 0.5) * 1.5,
    entropy: simulatedEntropy,
  };
}

wss.on("connection", (ws) => {
  console.log("Клієнт підключився до моніторингу");

  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const data = generateGeothermalData();
      ws.send(JSON.stringify(data));
    }
  }, 2000);

  ws.on("close", () => {
    console.log("Клієнт відключився");
    clearInterval(interval);
  });

  ws.on("error", (error) => {
    console.error("Помилка WebSocket:", error);
    clearInterval(interval);
  });
});
