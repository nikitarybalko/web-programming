const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { isAuthenticated, hasRole } = require("../middleware/auth");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Перевищено ліміт запитів. Спробуйте пізніше.",
  keyGenerator: (req) => {
    if (req.user && req.user.apiKey) {
      return req.user.apiKey;
    }
    return ipKeyGenerator(req.ip);
  },
});

router.use(apiLimiter);

router.get(
  "/v1/solar/generation",
  isAuthenticated,
  hasRole(["solar_engineer", "coordinator"]),
  (req, res) => {
    res.json({ data: "Показники сонячної генерації: 500 МВт" });
  },
);

router.get(
  "/v1/wind/generation",
  isAuthenticated,
  hasRole(["wind_engineer", "coordinator"]),
  (req, res) => {
    res.json({ data: "Показники вітрогенерації: 300 МВт" });
  },
);

router.post(
  "/v1/balance/adjust",
  isAuthenticated,
  hasRole(["coordinator"]),
  (req, res) => {
    const { adjustValue } = req.body;
    res.json({ message: `Баланс успішно скориговано на ${adjustValue} МВт` });
  },
);

function verifyWebhookSignature(req, res, next) {
  const signature = req.headers["x-webhook-signature"];
  const payload = JSON.stringify(req.body);

  if (!signature) {
    return res.status(401).json({ error: "Відсутній підпис вебхука" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: "Недійсний підпис вебхука" });
  }

  next();
}

router.post(
  "/webhooks/register",
  isAuthenticated,
  hasRole(["solar_engineer", "wind_engineer", "coordinator"]),
  (req, res) => {
    const { webhookUrl } = req.body;
    res.json({ message: "Вебхук успішно зареєстровано", url: webhookUrl });
  },
);

router.post("/webhooks/receive", verifyWebhookSignature, (req, res) => {
  res.json({ message: "Вебхук безпечно отримано та оброблено" });
});

module.exports = router;
