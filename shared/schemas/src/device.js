import { z } from "zod";

export const createDeviceSchema = z.object({
  fcmToken: z.string().trim().min(1, "'fcmToken' is required"),
}).strict();

export const updateDeviceSchema = z.object({
  fcmToken: z.string().trim().min(1, "'fcmToken' is required"),
}).strict();
