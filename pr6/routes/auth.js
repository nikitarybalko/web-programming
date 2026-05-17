const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).trim().escape(),
    body("name").notEmpty().trim().escape(),
    body("role").isIn(["solar_engineer", "wind_engineer", "coordinator"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name, role } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: "Користувач вже існує" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const apiKey = crypto.randomBytes(32).toString("hex");

      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role,
        apiKey,
      });

      res
        .status(201)
        .json({
          message: "Реєстрація успішна",
          user: { email: user.email, role: user.role, apiKey: user.apiKey },
        });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({
    message: "Вхід успішний",
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

module.exports = router;
