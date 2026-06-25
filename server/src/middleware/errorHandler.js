const { sendError } = require("../utils/response");

function notFoundHandler(req, res) {
  return sendError(res, "接口不存在。", 404);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500
      ? "服务器暂时无法处理请求，请稍后再试。"
      : error.message || "请求处理失败，请稍后再试。";

  if (statusCode >= 500) {
    console.error(error);
  }

  return sendError(res, message, statusCode);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
