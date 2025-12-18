import { sendData } from "../utils/response.js";
import { create as createTrigger } from "../services/triggerService.js";

async function create(req, res) {
  const result = await createTrigger(
    req.user.uid,
    req.params.profileId,
    req.body,
  );
  sendData(res, result, "Trigger created successfully");
}

export default { create };
