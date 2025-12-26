import dotenv from "dotenv";
import { randomBytes } from "crypto";

import { initialiseFirebase } from "./config/firebase.js";
import { connectToDatabase } from "./config/db.js";
import cron from "./cron.js";
import app from "./app.js";

const instanceId = randomBytes(4).toString("hex");

(async () => {
  dotenv.config({
    path: [
      ".env",
      `.env.${process.env.STAGE}`,
      `.env.${process.env.STAGE}.local`,
    ],
  });
  initialiseFirebase();
  await connectToDatabase();
  cron.start(instanceId);
  app.listen(process.env.PORT, () =>
    console.log(
      `🎉 Server (${process.env.STAGE}) is listening on port ${process.env.PORT} [instance: ${instanceId}]`,
    ),
  );
})();
