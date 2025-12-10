import dotenv from "dotenv";

import { initialiseFirebaseAdmin } from "./config/firebase.js";
import { initialiseDbConnection } from "./config/db.js";
import app from "./app.js";

(async () => {
  dotenv.config({ path: [".env", `.env.${process.env.STAGE}`] });
  initialiseFirebaseAdmin();
  await initialiseDbConnection();
  app.listen(process.env.PORT, () =>
    console.log(
      `Server (${process.env.STAGE}) is up and listening at ${process.env.PORT} port 🎉`,
    ),
  );
})();
