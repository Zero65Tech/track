import { sendData } from "../utils/response.js";
import cronService from "../services/cronService.js";

export default async function (req, res) {
  const result = await cronService();
  sendData(res, result, "Tasks created successfully");
}
