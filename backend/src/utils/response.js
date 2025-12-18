function sendSuccess(res, message) {
  res.status(200).json({
    success: true,
    message,
  });
}

function sendData(res, data, message) {
  res.status(200).json({
    success: true,
    data,
    message,
  });
}

function sendBadRequestError(res, message = "Bad Request") {
  res.status(400).json({
    success: false,
    message,
  });
}

function sendUnauthorizedError(res, message = "Unauthorized") {
  res.status(401).json({
    success: false,
    message,
  });
}

function sendForbiddenError(res, message = "Forbidden") {
  res.status(403).json({
    success: false,
    message,
  });
}

export {
  sendSuccess,
  sendData,
  sendBadRequestError,
  sendUnauthorizedError,
  sendForbiddenError,
};
