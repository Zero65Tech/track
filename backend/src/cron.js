import triggerService from "./services/triggerService.js";

function start() {
  console.log("🕐 Cron started (every 60 seconds)");
  triggerService.processAll().catch((err) => console.log(err));
  setInterval(() => {
    triggerService.processAll().catch((err) => console.log(err));
  }, 60 * 1000);
}

export default { start };
