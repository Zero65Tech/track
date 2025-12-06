import { sendForbiddenError } from "../utils/response.js";
import profileService from "../services/profileService.js";

export default async function (req, res, next) {
  const profile = await profileService._getCached(req.params.profileId);

  if (req.user.uid === profile.owner)
    return next(); // prettier-ignore

  if (profile.editors && profile.editors.includes(req.user.uid))
    return next(); // prettier-ignore

  if (req.method !== "GET")
    return sendForbiddenError(res, "You read-only access to this Profile."); // prettier-ignore

  if (profile.viewers && profile.viewers.includes(req.user.uid))
    return next(); // prettier-ignore

  return sendForbiddenError(res, "You don't have access to this Profile.");
}
