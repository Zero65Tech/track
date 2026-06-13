export { ProfileAccess, ProfileState } from "./profile.js";

export { EntryType, EntryState } from "./entry.js";

const DataSource = Object.freeze({
  BACKEND_SERVICE_V5_5: "Backend Service v5.5",
  MIGRATION_SCRIPT_V1_0: "Migration Script v1.0",
});

const EntryFieldState = Object.freeze({
  ACTIVE: Object.freeze({
    id: "active",
    name: "Active",
  }),
  DISABLED: Object.freeze({
    id: "disabled",
    name: "Disabled",
  }),
});

const TriggerType = Object.freeze({
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

const TriggerState = Object.freeze({
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

const AggregationName = Object.freeze({
  COUNTS_BY_HEAD_TAG: Object.freeze({
    id: "counts_by_head_tag",
    name: "Counts by Head & Tag",
  }),
  BALANCES_BY_BOOK: Object.freeze({
    id: "balances_by_book",
    name: "Balances by Book",
  }),
  BALANCES_BY_SOURCE: Object.freeze({
    id: "balances_by_source",
    name: "Balances by Source",
  }),
  AMOUNTS_BY_TYPE: Object.freeze({
    id: "amounts_by_type",
    name: "Amounts by Type",
  }),
});

const CoinLedgerRef = Object.freeze({
  TRIGGER: Object.freeze({ id: "trigger", name: "Trigger" }),
  AUTOMATION: Object.freeze({ id: "automation", name: "Automation" }),
});

const CoinLedgerType = Object.freeze({
  // TriggerType === 'PROFILE_CREATED'
  SIGNUP_BONUS: Object.freeze({ id: "signup_bonus", name: "Signup Bonus" }),
  REFERRAL_BONUS: Object.freeze({ id: "referral_bonus", name: "Referral Bonus" }), // prettier-ignore
  // TriggerType === 'PROFILE_OPENED'
  SUBSCRIPTION: Object.freeze({ id: "subscription", name: "Subscription" }),
  DAILY_STREAK: Object.freeze({ id: "daily_streak", name: "Daily Streak" }),
  // TriggerType === 'PURCHASE'
  PURCHASE: Object.freeze({ id: "purchase", name: "Purchase" }),
  // TriggerType === 'DATA_AGGREGATION'
  DATA_AGGREGATION: Object.freeze({ id: "data_aggregation", name: "Data Aggregation" }), // prettier-ignore
  // TriggerType === 'DATA_EXPORT'
  DATA_EXPORT: Object.freeze({ id: "data_export", name: "Data Export" }),
  // AutomationType === 'PULSE_EXPIRY'
  PULSE_EXPIRY: Object.freeze({ id: "pulse_expiry", name: "Pulse Expiry" }),
  // AutomationType === 'PROMOTION'
  PROMOTION: Object.freeze({ id: "promotion", name: "Promotion" }),
});

export {
  AggregationName,
  CoinLedgerRef,
  CoinLedgerType,
  DataSource,
  EntryFieldState,
  TriggerState,
  TriggerType,
};
