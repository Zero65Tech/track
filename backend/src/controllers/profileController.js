import { ProfileAccess, ProfileState } from "@shared/enums";
import { createProfileSchema, updateProfileSchema } from "@shared/schemas";
import mongoose from "mongoose";
import profileService from "../services/profileService.js";
import { sendBadRequestError, sendData } from "../utils/response.js";

async function getAccessibleProfiles(req, res) {
  const profiles = await profileService.getAccessibleProfiles(req.user.uid);

  for (let i = 0; i < profiles.length; i++) {
    profiles[i] = {
      id: profiles[i]._id.toString(),
      name: profiles[i].name,
      access:
        profiles[i].owner == req.user.uid
          ? ProfileAccess.OWNER.id
          : profiles[i].editors.includes(req.user.uid)
            ? ProfileAccess.EDITOR.id
            : ProfileAccess.VIEWER.id,
      state: profiles[i].state,
    };
  }

  sendData(res, { profiles });
}

async function getTemplateProfiles(req, res) {
  const profiles = await profileService.getTemplateProfiles();

  for (let i = 0; i < profiles.length; i++) {
    profiles[i] = {
      id: profiles[i]._id.toString(),
      name: profiles[i].name,
      access: ProfileAccess.VIEWER.id,
      state: ProfileState.TEMPLATE.id,
    };
  }

  sendData(res, { profiles });
}

async function createProfile(req, res) {
  const { success, error, data } = createProfileSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const profile = await profileService.createProfile(req.user.uid, data.name);

  sendData(
    res,
    {
      id: profile._id.toString(),
      name: profile.name,
      access: ProfileAccess.OWNER.id,
      state: profile.state,
    },
    "Profile created successfully.",
  );
}

async function updateProfile(req, res) {
  const { success, error, data } = updateProfileSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const profile = await profileService.updateProfile(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  sendData(
    res,
    {
      id: profile._id.toString(),
      name: profile.name,
      access: ProfileAccess.OWNER.id,
      state: profile.state,
    },
    "Profile updated successfully.",
  );
}

export default {
  getAccessibleProfiles,
  getTemplateProfiles,
  createProfile,
  updateProfile,
};
