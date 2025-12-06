import { sendUnauthorizedError } from "../utils/response.js";
import admin from "../config/firebase.js";

export default async function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return sendUnauthorizedError(res, "Authorization token is required.");

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      sendUnauthorizedError(res, "Authorization token has expired.");
    } else {
      throw error;
    }
  }
}
