import { _getCachedProfile } from "../services/profileService.js";
import { sendForbiddenError } from "../utils/response.js";
import { ProfileState } from "@shared/enums";

export default async function (req, res, next) {
  const profile = await _getCachedProfile(req.params.profileId);

  if (req.user.uid === profile.owner)
    return next(); // prettier-ignore

  if (profile.editors.includes(req.user.uid))
    return next(); // prettier-ignore

  if (req.method !== "GET")
    return sendForbiddenError(res, "You have read-only access to this Profile."); // prettier-ignore

  if (profile.viewers.includes(req.user.uid) || (profile.owner === process.env.SYSTEM_USER_ID && profile.state === ProfileState.TEMPLATE.id))
    return next(); // prettier-ignore

  return sendForbiddenError(res, "You don't have access to this Profile.");
}
