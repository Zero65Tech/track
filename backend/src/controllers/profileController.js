import { createProfileSchema, updateProfileSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import profileService from "../services/profileService.js";

async function getAccessibleProfiles(req, res) {
  const profiles = await profileService.getAccessibleProfiles(req.user.uid);
  sendData(res, { profiles });
}

async function getTemplateProfiles(req, res) {
  const profiles = await profileService.getTemplateProfiles();
  sendData(res, { profiles });
}

async function createProfile(req, res) {
  const { success, error, data } = createProfileSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const profile = await profileService.createProfile(req.user.uid, data.name);
  sendData(res, { profile }, "Profile created successfully.");
}

async function updateProfile(req, res) {
  const {
    success,
    error,
    data: updates,
  } = updateProfileSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const profile = await profileService.updateProfile(
    req.user.uid,
    req.params.id,
    updates,
  );
  sendData(res, { profile }, "Profile updated successfully.");
}

export default {
  getAccessibleProfiles,
  getTemplateProfiles,
  createProfile,
  updateProfile,
};
