const form = document.getElementById("pointForm");
const pointsGrid = document.getElementById("pointsGrid");
const filterOverdue = document.getElementById("filterOverdue");
const toast = document.getElementById("toast");

let allPoints = [];

document.addEventListener("DOMContentLoaded", loadPoints);
filterOverdue.addEventListener("change", renderPoints);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showToast("Точку успішно додано", "success");
      form.reset();
      await loadPoints();
    } else {
      showToast("Помилка збереження", "error");
    }
  } catch (error) {
    showToast("Помилка з'єднання", "error");
  }
});

async function loadPoints() {
  try {
    const response = await fetch("/api/points", { cache: "no-store" });
    allPoints = await response.json();
    renderPoints();
  } catch (error) {
    showToast("Не вдалося завантажити дані", "error");
  }
}

function renderPoints() {
  const showOnlyOverdue = filterOverdue.checked;
  const today = new Date().setHours(0, 0, 0, 0);

  let filtered = allPoints;

  if (showOnlyOverdue) {
    filtered = allPoints.filter(
      (p) => new Date(p.verificationDate).getTime() < today,
    );
  }

  if (filtered.length === 0) {
    pointsGrid.innerHTML =
      '<p style="color: var(--text-light)">Немає записів для відображення</p>';
    return;
  }

  pointsGrid.innerHTML = filtered
    .map((point) => {
      const isOverdue = new Date(point.verificationDate).getTime() < today;
      let classes = "point-card";
      if (point.isControlled) classes += " controlled";
      if (isOverdue) classes += " overdue";

      let badges = "";
      if (isOverdue)
        badges += '<span class="status-badge danger">Прострочено</span>';
      if (point.isControlled)
        badges += '<span class="status-badge control">На контролі</span>';

      return `
            <div class="${classes}">
                <div class="card-header">
                    <div>
                        <h3>№ ${point.number}</h3>
                        <div style="margin-top: 0.25rem; display: flex; gap: 0.5rem;">${badges}</div>
                    </div>
                    <button class="btn btn-icon" onclick="deletePoint('${point.id}')">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div class="info-row">
                    <span class="info-label">Об'єкт:</span>
                    <span>${point.objectName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Лічильник:</span>
                    <span>${point.meterType}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Повірка:</span>
                    <span style="${isOverdue ? "color: var(--danger); font-weight: bold;" : ""}">
                        ${new Date(point.verificationDate).toLocaleDateString("uk-UA")}
                    </span>
                </div>
            </div>
        `;
    })
    .join("");
}

async function deletePoint(id) {
  if (!confirm("Видалити цю точку обліку?")) return;

  try {
    const response = await fetch(`/api/points/${id}`, { method: "DELETE" });
    if (response.ok) {
      loadPoints();
    }
  } catch (error) {
    showToast("Помилка видалення", "error");
  }
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => (toast.className = "toast"), 3000);
}
