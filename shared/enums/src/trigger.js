export const TriggerType = Object.freeze({
  PROFILE_CREATED: Object.freeze({
    id: "profile_created",
    name: "Profile Created",
  }),
  PROFILE_OPENED: Object.freeze({
    id: "profile_opened",
    name: "Profile Opened",
  }),
  DATA_AGGREGATION: Object.freeze({
    id: "data_aggregation",
    name: "Data Aggregation",
  }),
  DATA_EXPORT: Object.freeze({
    id: "data_export",
    name: "Data Export",
  }),
});

export const TriggerState = Object.freeze({
  QUEUED: Object.freeze({
    id: "queued",
    name: "Queued",
  }),
  RUNNING: Object.freeze({
    id: "running",
    name: "Running",
  }),
  FAILED: Object.freeze({
    id: "failed",
    name: "Failed",
  }),
  COMPLETED: Object.freeze({
    id: "completed",
    name: "Completed",
  }),
});
