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
  const userId = req.user.uid;
  const data = req.body;

  const {
    success,
    error,
    data: validatedData,
  } = createProfileSchema.safeParse(data);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const profile = await profileService.createProfile(
    userId,
    validatedData.name,
  );
  sendData(res, { profile }, "Profile created successfully.");
}

async function updateProfile(req, res) {
  const userId = req.user.uid;
  const profileId = req.params.id;
  const updates = req.body;

  const {
    success,
    error,
    data: validatedUpdates,
  } = updateProfileSchema.safeParse(updates);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const profile = await profileService.updateProfile(
    userId,
    profileId,
    validatedUpdates,
  );
  sendData(res, { profile }, "Profile updated successfully.");
}

export default {
  getAccessibleProfiles,
  getTemplateProfiles,
  createProfile,
  updateProfile,
};
