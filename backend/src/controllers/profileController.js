import { sendData } from "../utils/response.js";
import {
  getAllAccessible as getAllAccessibleProfiles,
  getTemplatesBySystem as getProfileTemplates,
  create as createProfile,
  update as updateProfile,
} from "../services/profileService.js";

async function getAllAccessible(req, res) {
  const profiles = await getAllAccessibleProfiles(req.user.uid);
  sendData(res, { profiles });
}

async function getTemplatesBySystem(req, res) {
  const profiles = await getProfileTemplates();
  sendData(res, { profiles });
}

async function create(req, res) {
  const profile = await createProfile(req.body.name, req.user.uid);
  sendData(res, { profile }, "Profile created successfully.");
}

async function update(req, res) {
  const profile = await updateProfile(req.params.id, req.body, req.user.uid);
  sendData(res, { profile }, "Profile updated successfully.");
}

export default { getAllAccessible, getTemplatesBySystem, create, update };
