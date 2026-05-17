require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB підключено"))
  .catch((err) => console.log("Помилка підключення до MongoDB:", err));

app.use(helmet());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 },
  }),
);

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user)
          return done(null, false, { message: "Користувача не знайдено" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: "Невірний пароль" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер VPP запущено на порті ${PORT}`);
});
