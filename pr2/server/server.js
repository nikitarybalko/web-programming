const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const STATION_CONFIG = {
    power: { max: 150 },
    voltage: { min: 200, max: 800 },
    current: { max: 200 },
    battery: { max: 100 },
};

function generateData() {
    let voltage =
        Math.random() *
            (STATION_CONFIG.voltage.max - STATION_CONFIG.voltage.min) +
        STATION_CONFIG.voltage.min;

    if (Math.random() < 0.1) {
        voltage = STATION_CONFIG.voltage.max + Math.random() * 70 + 10;
    }

    return JSON.stringify({
        power: (Math.random() * STATION_CONFIG.power.max).toFixed(1),
        voltage: voltage.toFixed(0),
        current: (Math.random() * STATION_CONFIG.current.max).toFixed(1),
        battery: (Math.random() * STATION_CONFIG.battery.max).toFixed(0),
        timestamp: new Date().toLocaleTimeString("uk-UA"),
    });
}

wss.on("connection", (ws) => {
    console.log("Новий клієнт підключився!");

    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(generateData());
        }
    }, 2000);

    ws.on("message", (message) => {
        const request = JSON.parse(message);
        if (request.action === "request_update") {
            console.log("Клієнт попросив позачергове оновлення");
            ws.send(generateData());
        }
    });

    ws.on("close", () => {
        console.log("Клієнт відключився");
        clearInterval(interval);
    });
});

console.log("WebSocket сервер запущено на ws://localhost:8080");
