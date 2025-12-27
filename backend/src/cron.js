import { _processTriggers } from "./services/triggerService.js";

const CRON_INTERVAL_MS = 5 * 1000;

async function start(instanceId) {
  console.log(
    `🕐 Cron started (every ${CRON_INTERVAL_MS / 1000} seconds) [instance: ${instanceId}]`,
  );
  while (true) {
    await _processTriggers(instanceId).catch((err) => console.log(err));
    await new Promise((resolve) => setTimeout(resolve, CRON_INTERVAL_MS));
  }
}

export default { start };
