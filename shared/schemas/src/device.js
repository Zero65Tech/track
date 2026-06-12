import { z } from "zod";
import { fcmTokenSchema } from "./common.js";

export const createDeviceSchema = z
  .object({
    fcmToken: fcmTokenSchema,
  })
  .strict();

export const updateDeviceSchema = z
  .object({
    fcmToken: fcmTokenSchema,
  })
  .strict();
