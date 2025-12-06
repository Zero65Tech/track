import { sendData } from "../utils/response.js";
import triggerService from "../services/triggerService.js";

async function create(req, res) {
  const result = await triggerService.create(
    req.params.profileId,
    req.body.type,
    req.body.params,
    req.user.uid,
  );
  sendData(res, result, "Tasks created successfully");
}

export default { create };
