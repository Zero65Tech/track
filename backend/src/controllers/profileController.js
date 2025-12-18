import { sendData } from "../utils/response.js";
import {
  getAccessibleProfiles,
  getTemplateProfiles,
  createProfile,
  updateProfile,
} from "../services/profileService.js";

async function getAllAccessible(req, res) {
  const profiles = await getAccessibleProfiles(req.user.uid);
  sendData(res, { profiles });
}

async function getTemplatesBySystem(req, res) {
  const profiles = await getTemplateProfiles();
  sendData(res, { profiles });
}

async function create(req, res) {
  const profile = await createProfile(req.body.name, req.user.uid);
  sendData(res, { profile }, "Profile created successfully.");
}

async function update(req, res) {
  const profile = await updateProfile(req.user.uid, req.params.id, req.body);
  sendData(res, { profile }, "Profile updated successfully.");
}

export default { getAllAccessible, getTemplatesBySystem, create, update };
