function sendData(res, data, message = null) {
  res.status(200).json({
    data,
    message,
  });
}

function sendSuccess(res, message = null) {
  res.status(200).json({
    message,
  });
}

function sendBadRequestError(res, error, message = "Validation Error") {
  res.status(400).json({
    error,
    message,
  });
}

function sendUnauthorizedError(res, message = "Unauthorized Access") {
  res.status(401).json({
    message,
  });
}

function sendForbiddenError(res, message = "Forbidden Resource") {
  res.status(403).json({
    message,
  });
}

export {
  sendData,
  sendSuccess,
  sendBadRequestError,
  sendUnauthorizedError,
  sendForbiddenError,
};
