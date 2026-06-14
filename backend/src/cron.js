import triggerService from "./services/triggerService.js";
import { _notifyTriggerUpdate } from "./services/notificationService.js";

const CRON_INTERVAL_MS = 5000;

async function start(instanceId) {
  console.log(
    `🕐 Cron started (every ${CRON_INTERVAL_MS / 1000} seconds) [instance: ${instanceId}]`,
  );
  while (true) {
    await triggerService
      .processTriggers(async (triggerData) => {
        console.log(triggerData);
        await _notifyTriggerUpdate(triggerData);
      }, instanceId)
      .catch((err) => console.log(err));
    await new Promise((resolve) => setTimeout(resolve, CRON_INTERVAL_MS));
  }
}

export default { start };
