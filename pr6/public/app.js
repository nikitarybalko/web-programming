document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const authSection = document.getElementById("auth-section");
  const dashboard = document.getElementById("dashboard");
  const output = document.getElementById("output");
  const userInfo = document.getElementById("user-info");

  function logOutput(data) {
    output.textContent = JSON.stringify(data, null, 2);
  }

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("reg-name").value,
      email: document.getElementById("reg-email").value,
      password: document.getElementById("reg-password").value,
      role: document.getElementById("reg-role").value,
    };

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      logOutput(data);
    } catch (err) {
      logOutput({ error: err.message });
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById("log-email").value,
      password: document.getElementById("log-password").value,
    };

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      logOutput(data);

      if (res.ok) {
        authSection.style.display = "none";
        dashboard.style.display = "block";
        userInfo.textContent = `(Роль: ${data.user.role})`;
      }
    } catch (err) {
      logOutput({ error: err.message });
    }
  });

  document.getElementById("btn-solar").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/v1/solar/generation");
      const data = await res.json();
      logOutput({ status: res.status, ...data });
    } catch (err) {
      logOutput({ error: err.message });
    }
  });

  document.getElementById("btn-wind").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/v1/wind/generation");
      const data = await res.json();
      logOutput({ status: res.status, ...data });
    } catch (err) {
      logOutput({ error: err.message });
    }
  });

  document.getElementById("btn-adjust").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/v1/balance/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustValue: 10 }),
      });
      const data = await res.json();
      logOutput({ status: res.status, ...data });
    } catch (err) {
      logOutput({ error: err.message });
    }
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    document.cookie =
      "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    location.reload();
  });
});
