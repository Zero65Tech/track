import dotenv from "dotenv";

import { initialiseFirebaseAdmin } from "./config/firebase.js";
import { initialiseDbConnection } from "./config/db.js";
import cron from "./cron.js";
import app from "./app.js";

(async () => {
  dotenv.config({
    path: [
      ".env",
      `.env.${process.env.STAGE}`,
      `.env.${process.env.STAGE}.local`,
    ],
  });
  initialiseFirebaseAdmin();
  await initialiseDbConnection();
  cron.start();
  app.listen(process.env.PORT, () =>
    console.log(
      `🎉 Server (${process.env.STAGE}) is listening on port ${process.env.PORT}`,
    ),
  );
})();
