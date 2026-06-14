import { randomBytes } from "crypto";
import dotenv from "dotenv";

import { connectToDatabase } from "./config/db.js";
import { initialiseFirebase } from "./config/firebase.js";

import app from "./app.js";

process.env.INSTANCE_ID = randomBytes(4).toString("hex");

dotenv.config({
  path: [
    ".env",
    `.env.${process.env.STAGE}`,
    `.env.${process.env.STAGE}.local`,
  ],
});

initialiseFirebase();
await connectToDatabase();

app.listen(process.env.PORT, () =>
  console.log(
    `🎉 Server (${process.env.STAGE}) is listening on port ${process.env.PORT} [instance: ${process.env.INSTANCE_ID}]`,
  ),
);
