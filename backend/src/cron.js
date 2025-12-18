import { processTriggers } from "./services/triggerService.js";

function start() {
  console.log("🕐 Cron started (every 60 seconds)");
  processTriggers().catch((err) => console.log(err));
  setInterval(() => {
    processTriggers().catch((err) => console.log(err));
  }, 60 * 1000);
}

export default { start };
