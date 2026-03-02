const STATION_CONFIG = {
    power:   { min: 0, max: 150, normMin: 20, normMax: 120 },
    voltage: { min: 200, max: 800, normMin: 350, normMax: 450 },
    current: { min: 0, max: 200, normMin: 50, normMax: 150 },
    battery: { min: 0, max: 100, normMin: 20, normMax: 95 }
};

let isAutoEnabled = false;
let autoInterval = null;
let accumulatedEnergy = parseFloat(localStorage.getItem('totalEnergy')) || 1450.5;
let dailyChargesCount = parseInt(localStorage.getItem('dailyCharges')) || 12;
let measurementHistory = JSON.parse(localStorage.getItem('sensorHistory')) || [];

let powerChart;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    if(measurementHistory.length > 0) {
        measurementHistory.forEach(data => {
            addDataToChart(data.time, data.power);
        });
    }

    manualUpdate();

    document.getElementById('updateBtn').addEventListener('click', manualUpdate);
    document.getElementById('autoUpdateBtn').addEventListener('click', toggleAutoUpdate);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
});

function generateSensorData() {
    // Базові випадкові значення в межах норми та попередження
    let power = Math.random() * STATION_CONFIG.power.max;
    let voltage = Math.random() * (STATION_CONFIG.voltage.max - STATION_CONFIG.voltage.min) + STATION_CONFIG.voltage.min;
    let current = Math.random() * STATION_CONFIG.current.max;
    let battery = Math.random() * STATION_CONFIG.battery.max;

    // Імітація аварійної ситуації (шанс 10%)
    const isAnomaly = Math.random() < 0.10; 
    
    if (isAnomaly) {
        const errorType = Math.floor(Math.random() * 3);
        if (errorType === 0) {
            // Перенапруга 
            voltage = STATION_CONFIG.voltage.max + Math.random() * 70 + 10; 
        } else if (errorType === 1) {
            // Перевантаження по струму
            current = STATION_CONFIG.current.max + Math.random() * 40 + 10;
        } else {
            // Просадка напруги
            voltage = STATION_CONFIG.voltage.min - Math.random() * 50 - 10;
        }
    }

    return {
        power: power.toFixed(1),
        voltage: voltage.toFixed(0),
        current: current.toFixed(1),
        battery: battery.toFixed(0),
        timestamp: formatTimestamp()
    };
}

function checkStatus(value, configName) {
    const val = parseFloat(value);
    const conf = STATION_CONFIG[configName];
    
    if (val >= conf.normMin && val <= conf.normMax) return 'normal';
    if (val >= conf.min && val <= conf.max) return 'warning';
    return 'critical';
}

function formatTimestamp() {
    return new Date().toLocaleTimeString('uk-UA');
}

function updateDisplay(data) {
    const batteryLevel = parseFloat(data.battery);
    const connectorStatusEl = document.getElementById('connector-status');

    if (batteryLevel >= 100) {
        data.power = "0.0";
        data.current = "0.0";
        connectorStatusEl.textContent = "Заряджено повністю";
        connectorStatusEl.className = "value-text status-normal";
    } else if (parseFloat(data.power) > 0) {
        accumulatedEnergy += (parseFloat(data.power) / 3600);
        connectorStatusEl.textContent = "Заряджання...";
        connectorStatusEl.className = "value-text status-warning";
    } else {
        connectorStatusEl.textContent = "Очікування";
        connectorStatusEl.className = "value-text status-normal";
    }

    document.getElementById('param-power').textContent = data.power;
    document.getElementById('param-voltage').textContent = data.voltage;
    document.getElementById('param-current').textContent = data.current;
    document.getElementById('param-battery').textContent = data.battery;
    document.getElementById('lastUpdate').textContent = data.timestamp;
    
    updateStatusElement('power', data.power);
    updateStatusElement('voltage', data.voltage);
    updateStatusElement('current', data.current);
    updateStatusElement('battery', data.battery);
    
    document.getElementById('total-energy').textContent = accumulatedEnergy.toFixed(2);
    document.getElementById('daily-charges').textContent = dailyChargesCount;

    saveData(data);
    addDataToChart(data.timestamp, data.power);
}

function updateStatusElement(param, value) {
    const statusStr = checkStatus(value, param);
    const element = document.getElementById(`status-${param}`);
    
    let text = "● Норма";
    if (statusStr === 'warning') text = "▲ Попередження";
    if (statusStr === 'critical') {
        text = "❌ Критично";
        playAlertSound(); 
    }
    
    element.textContent = text;
    element.className = `status-indicator status-${statusStr}`;
}

function manualUpdate() {
    const newData = generateSensorData();
    updateDisplay(newData);
}

function toggleAutoUpdate() {
    const btn = document.getElementById('autoUpdateBtn');
    const statusText = document.getElementById('autoStatus');

    if (!isAutoEnabled) {
        autoInterval = setInterval(manualUpdate, 3000); 
        isAutoEnabled = true;
        btn.innerHTML = '⏸️ Зупинити автооновлення';
        btn.classList.replace('btn-success', 'btn-danger');
        statusText.textContent = 'Увімкнено (3с)';
    } else {
        clearInterval(autoInterval);
        isAutoEnabled = false;
        btn.innerHTML = '▶️ Автооновлення';
        btn.classList.replace('btn-danger', 'btn-success');
        statusText.textContent = 'Вимкнено';
    }
}

function saveData(data) {
    measurementHistory.push(data);
    
    if (measurementHistory.length > 20) {
        measurementHistory.shift();
    }
    localStorage.setItem('sensorHistory', JSON.stringify(measurementHistory));
    localStorage.setItem('totalEnergy', accumulatedEnergy.toString());
    localStorage.setItem('dailyCharges', dailyChargesCount.toString());
}

function initChart() {
    const ctx = document.getElementById('powerChart').getContext('2d');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#a0a0a0' : '#7f8c8d';

    powerChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Потужність (кВт)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, max: 160,
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
}

function addDataToChart(label, data) {
    powerChart.data.labels.push(label);
    powerChart.data.datasets[0].data.push(data);

    if (powerChart.data.labels.length > 15) {
        powerChart.data.labels.shift();
        powerChart.data.datasets[0].data.shift();
    }
    powerChart.update();
}

function playAlertSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'square';
    oscillator.frequency.value = 800; 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
}

function exportToCSV() {
    if (measurementHistory.length === 0) {
        alert("Немає даних для експорту!");
        return;
    }

    let csvContent = "\uFEFFЧас;Потужність (кВт);Напруга (В);Струм (А);Заряд АКБ (%)\n";
    
    measurementHistory.forEach(row => {
        const p = row.power.toString().replace('.', ',');
        const v = row.voltage.toString().replace('.', ',');
        const c = row.current.toString().replace('.', ',');
        
        csvContent += `${row.timestamp};${p};${v};${c};${row.battery}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ev_station_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    
    const textColor = newTheme === 'dark' ? '#a0a0a0' : '#7f8c8d';
    powerChart.options.scales.x.ticks.color = textColor;
    powerChart.options.scales.y.ticks.color = textColor;
    powerChart.options.plugins.legend.labels.color = textColor;
    powerChart.update();
}