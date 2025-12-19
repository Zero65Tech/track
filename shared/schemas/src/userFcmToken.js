import { z } from "zod";

export const storeFcmTokenSchema = z.object({
  deviceId: z.string().trim().min(1, "'deviceId' is required"),
  fcmToken: z.string().trim().min(1, "'fcmToken' is required"),
}).strict();
