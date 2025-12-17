import { processAll } from "./services/triggerService.js";

function start() {
  console.log("🕐 Cron started (every 60 seconds)");
  processAll().catch((err) => console.log(err));
  setInterval(() => {
    processAll().catch((err) => console.log(err));
  }, 60 * 1000);
}

export default { start };
