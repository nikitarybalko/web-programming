const API_URL = "http://localhost:3000/api/capacitor-banks";

async function makeRequest(type) {
  const id = document.getElementById("bankId").value;
  const bodyText = document.getElementById("jsonBody").value;
  const responseArea = document.getElementById("responseArea");
  const statusBadge = document.getElementById("statusBadge");

  let url = API_URL;
  let options = { headers: { "Content-Type": "application/json" } };

  try {
    switch (type) {
      case "GET_ALL":
        options.method = "GET";
        break;
      case "GET_ONE":
        if (!id) throw new Error("Вкажіть ID");
        url += `/${id}`;
        options.method = "GET";
        break;
      case "POST":
        options.method = "POST";
        options.body = bodyText;
        break;
      case "PUT":
        if (!id) throw new Error("Вкажіть ID");
        url += `/${id}`;
        options.method = "PUT";
        options.body = bodyText;
        break;
      case "PATCH":
        if (!id) throw new Error("Вкажіть ID");
        url += `/${id}`;
        options.method = "PATCH";
        options.body = bodyText;
        break;
      case "DELETE":
        if (!id) throw new Error("Вкажіть ID");
        url += `/${id}`;
        options.method = "DELETE";
        break;
    }

    responseArea.textContent = "Завантаження...";
    const response = await fetch(url, options);
    const data = await response.json();

    // Оновлення інтерфейсу
    statusBadge.textContent = `Status: ${response.status}`;
    statusBadge.className = response.ok
      ? "badge bg-success"
      : "badge bg-danger";
    responseArea.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    statusBadge.textContent = `Error`;
    statusBadge.className = "badge bg-danger";
    responseArea.textContent = error.message;
  }
}
