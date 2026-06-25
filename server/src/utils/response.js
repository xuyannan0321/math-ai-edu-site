function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function sendError(res, message = "请求处理失败，请稍后再试。", statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
  sendSuccess,
  sendError,
  createHttpError,
};
