class GeothermalMonitor {
  constructor() {
    this.powerChart = null;
    this.tsChart = null;
    this.dataHistory = [];

    this.initCharts();
    this.connectWebSocket();
  }

  initCharts() {
    // Графік потужності (Line Chart)
    const powerCtx = document.getElementById("powerChart").getContext("2d");
    this.powerChart = new Chart(powerCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Електрична потужність (МВт)",
            data: [],
            borderColor: "#198754",
            backgroundColor: "rgba(25, 135, 84, 0.2)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        animation: { duration: 0 },
        scales: {
          y: { min: 20, max: 35 },
        },
      },
    });

    // T-S Діаграма (Scatter Chart)
    const tsCtx = document.getElementById("tsChart").getContext("2d");
    this.tsChart = new Chart(tsCtx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Поточний стан (T-S)",
            data: [],
            backgroundColor: "#dc3545",
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        animation: { duration: 0 },
        scales: {
          x: {
            title: { display: true, text: "Ентропія (S)" },
            min: 2.0,
            max: 3.0,
          },
          y: {
            title: { display: true, text: "Температура (°C)" },
            min: 180,
            max: 220,
          },
        },
      },
    });
  }

  connectWebSocket() {
    const statusBadge = document.getElementById("wsStatus");
    this.socket = new WebSocket("ws://localhost:8080");

    this.socket.onopen = () => {
      statusBadge.textContent = "Онлайн";
      statusBadge.className = "badge bg-success status-badge";
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateDashboard(data);
    };

    this.socket.onclose = () => {
      statusBadge.textContent = "Офлайн";
      statusBadge.className = "badge bg-danger status-badge";
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.socket.onerror = (error) => {
      console.error("Помилка WebSocket:", error);
    };
  }

  updateDashboard(data) {
    // Оновлення текстових карток
    document.getElementById("valTemp").textContent =
      data.temperature.toFixed(1);
    document.getElementById("valPressure").textContent =
      data.pressure.toFixed(1);
    document.getElementById("valPower").textContent = data.power.toFixed(2);
    document.getElementById("valFlow").textContent = data.flowRate.toFixed(1);
    document.getElementById("valEff").textContent = data.efficiency.toFixed(1);

    const timeStr = new Date(data.timestamp).toLocaleTimeString("uk-UA");

    // Оновлення графіка потужності
    this.powerChart.data.labels.push(timeStr);
    this.powerChart.data.datasets[0].data.push(data.power);
    if (this.powerChart.data.labels.length > 20) {
      this.powerChart.data.labels.shift();
      this.powerChart.data.datasets[0].data.shift();
    }
    this.powerChart.update();

    // Оновлення T-S діаграми
    this.tsChart.data.datasets[0].data.push({
      x: data.entropy,
      y: data.temperature,
    });
    if (this.tsChart.data.datasets[0].data.length > 10) {
      this.tsChart.data.datasets[0].data.shift();
    }
    this.tsChart.update();

    // Оновлення таблиці історії
    this.dataHistory.unshift(data);
    if (this.dataHistory.length > 10) this.dataHistory.pop();

    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = this.dataHistory
      .map(
        (row) => `
            <tr>
                <td class="text-muted">${new Date(row.timestamp).toLocaleTimeString("uk-UA")}</td>
                <td>${row.temperature.toFixed(2)}</td>
                <td>${row.pressure.toFixed(2)}</td>
                <td class="fw-bold text-success">${row.power.toFixed(2)}</td>
                <td>${row.flowRate.toFixed(2)}</td>
                <td>${row.efficiency.toFixed(2)}</td>
            </tr>
        `,
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new GeothermalMonitor();
});
