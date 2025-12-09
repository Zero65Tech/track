import { sendData } from "../utils/response.js";
import profileService from "../services/profileService.js";

async function getAllAccessible(req, res) {
  const profiles = await profileService.getAllAccessible(req.user.uid);
  sendData(res, { profiles });
}

async function getTemplatesBySystem(req, res) {
  const profiles = await profileService.getTemplatesBySystem();
  sendData(res, { profiles });
}

async function create(req, res) {
  const profile = await profileService.create(req.body.name, req.user.uid);
  sendData(res, { profile }, "Profile created successfully.");
}

async function update(req, res) {
  const profile = await profileService.update(
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { profile }, "Profile updated successfully.");
}

export default { getAllAccessible, getTemplatesBySystem, create, update };
