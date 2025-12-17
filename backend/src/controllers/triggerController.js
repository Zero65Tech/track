import { sendData } from "../utils/response.js";
import { create as createTrigger } from "../services/triggerService.js";

async function create(req, res) {
  const result = await createTrigger(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, result, "Trigger created successfully");
}

export default { create };
