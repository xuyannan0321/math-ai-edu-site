const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { env } = require("../config/env");
const { authRequired } = require("../middleware/auth");
const { createHttpError, sendSuccess } = require("../utils/response");

const router = express.Router();

function normalizeUsername(username) {
  return String(username || "").trim();
}

function validateUsername(username) {
  return /^[A-Za-z0-9_\u4e00-\u9fa5]{3,32}$/.test(username);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 72;
}

function createToken(user) {
  return jwt.sign(
    {
      username: user.username,
      role: user.role,
    },
    env.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: env.jwtExpiresIn,
    },
  );
}

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;

    if (!validateUsername(username)) {
      throw createHttpError(400, "用户名需为 3-32 位中文、英文、数字或下划线。");
    }

    if (!validatePassword(password)) {
      throw createHttpError(400, "密码长度需为 6-72 位。");
    }

    const [existingRows] = await pool.execute(
      "SELECT id FROM users WHERE username = :username LIMIT 1",
      { username },
    );

    if (existingRows.length) {
      throw createHttpError(409, "用户名已存在，请换一个。");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO users (username, password_hash, role) VALUES (:username, :passwordHash, 'teacher')",
      { username, passwordHash },
    );

    const user = {
      id: result.insertId,
      username,
      role: "teacher",
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    const token = createToken(user);

    return sendSuccess(res, { token, user: serializeUser(user) }, 201);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;

    if (!username || !password) {
      throw createHttpError(400, "请输入用户名和密码。");
    }

    const [rows] = await pool.execute(
      "SELECT id, username, password_hash, role, created_at, last_login_at FROM users WHERE username = :username LIMIT 1",
      { username },
    );

    if (!rows.length) {
      throw createHttpError(401, "用户名或密码不正确。");
    }

    const user = rows[0];
    const passwordMatched = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatched) {
      throw createHttpError(401, "用户名或密码不正确。");
    }

    await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = :id", {
      id: user.id,
    });

    user.last_login_at = new Date().toISOString();

    return sendSuccess(res, {
      token: createToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, (req, res) => {
  return sendSuccess(res, {
    user: serializeUser(req.user),
  });
});

module.exports = router;
