import { sendData } from "../utils/response.js";
import triggerService from "../services/triggerService.js";

async function create(req, res) {
  const result = await triggerService.create(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, result, "Trigger created successfully");
}

export default { create };
