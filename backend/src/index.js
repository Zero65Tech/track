import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: `.env.${process.env.STAGE}` });

import db from "./config/db.js";
import app from "./app.js";

(async () => {
  await db.connect();
  app.listen(process.env.PORT, () =>
    console.log(
      `Server (${process.env.STAGE}) is up and listening at ${process.env.PORT} port.`,
    ),
  );
})();
