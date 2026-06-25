const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { env } = require("../config/env");
const { createHttpError } = require("../utils/response");

async function authRequired(req, res, next) {
  try {
    const authHeader = req.get("Authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw createHttpError(401, "请先登录后再访问。");
    }

    let payload;

    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw createHttpError(401, "登录状态已失效，请重新登录。");
    }

    const [rows] = await pool.execute(
      "SELECT id, username, role, created_at, last_login_at FROM users WHERE id = :id LIMIT 1",
      { id: payload.sub },
    );

    if (!rows.length) {
      throw createHttpError(401, "登录用户不存在，请重新登录。");
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authRequired,
};
