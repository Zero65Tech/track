import { sendData } from "../utils/response.js";
import profileService from "../services/profileService.js";

async function getAll(req, res) {
  const profiles = await profileService.getAll(req.user.uid);
  sendData(res, { profiles });
}

async function getSystemTemplates(req, res) {
  const profiles = await profileService.getSystemTemplates();
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

export default { getAll, getSystemTemplates, create, update };
