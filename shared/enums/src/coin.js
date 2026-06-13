export const CoinLedgerRef = Object.freeze({
  TRIGGER: Object.freeze({ id: "trigger", name: "Trigger" }),
  AUTOMATION: Object.freeze({ id: "automation", name: "Automation" }),
});

export const CoinLedgerType = Object.freeze({
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
