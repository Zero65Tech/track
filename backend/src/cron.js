import { _processTriggers } from "./services/triggerService.js";

function start() {
  console.log("🕐 Cron started (every 60 seconds)");
  _processTriggers().catch((err) => console.log(err));
  setInterval(() => {
    _processTriggers().catch((err) => console.log(err));
  }, 60 * 1000);
}

export default { start };
