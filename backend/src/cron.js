import { _processTriggers } from "./services/triggerService.js";

const CRON_INTERVAL_MS = 10 * 1000;

function start() {
  console.log(`🕐 Cron started (every ${CRON_INTERVAL_MS / 1000} seconds)`);
  _processTriggers().catch((err) => console.log(err));
  setInterval(() => {
    _processTriggers().catch((err) => console.log(err));
  }, CRON_INTERVAL_MS);
}

export default { start };
