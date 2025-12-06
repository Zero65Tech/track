const ProfileAccess = Object.freeze({
  OWNER: Object.freeze({
    id: "owner",
    name: "Owner",
    description:
      "Full control over the profile: can edit settings, manage access, and delete the profile.",
  }),
  EDITOR: Object.freeze({
    id: "editor",
    name: "Editor",
    description:
      "Can modify profile content and settings but cannot manage access or delete the profile.",
  }),
  VIEWER: Object.freeze({
    id: "viewer",
    name: "Viewer",
    description:
      "Read-only access to view profile content and settings without making changes.",
  }),
});

const ProfileState = Object.freeze({
  INACTIVE: Object.freeze({
    id: "inactive",
    name: "Inactive",
    description:
      "This profile is still being set up. The system needs to finish a few setup steps before you can start using it. Once everything’s ready, it will automatically become active.",
  }),
  ACTIVE: Object.freeze({
    id: "active",
    name: "Active",
    description:
      "This profile is fully ready to use. You can access all features and manage it like normal.",
  }),
  TEMPLATE: Object.freeze({
    id: "template",
    name: "Template",
    description:
      "Think of this as a reusable starter profile. You can copy it to quickly create a new profile with your preferred settings already in place.",
  }),
  DISABLED: Object.freeze({
    id: "disabled",
    name: "Disabled",
    description:
      "This profile has been turned off for now. You can view it in read‑only mode, but it can’t be used until it’s re‑enabled.",
  }),
  DELETED: Object.freeze({
    id: "deleted",
    name: "Deleted",
    description:
      "This profile is scheduled for deletion. It will be permanently removed after 30 days, but you can still restore it anytime before that if you change your mind.",
  }),
});

const EntryType = Object.freeze({
  CREDIT: Object.freeze({ id: "credit", name: "Credit" }),
  DEBIT: Object.freeze({ id: "debit", name: "Debit" }),
  INCOME: Object.freeze({ id: "income", name: "Income" }),
  EXPENSE: Object.freeze({ id: "expense", name: "Expense" }),
  REFUND: Object.freeze({ id: "refund", name: "Refund" }),
  TAX: Object.freeze({ id: "tax", name: "Tax" }),
  PAYMENT: Object.freeze({ id: "payment", name: "Payment" }),
  RECEIPT: Object.freeze({ id: "receipt", name: "Receipt" }),
  RELOCATE: Object.freeze({ id: "relocate", name: "Relocate" }),
  TRANSFER: Object.freeze({ id: "transfer", name: "Transfer" }),
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
  PENDING: Object.freeze({
    id: "pending",
    name: "Pending",
  }),
  CANCELLED: Object.freeze({
    id: "cancelled",
    name: "Cancelled",
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
  HEAD_TAG: Object.freeze({ id: "head-tag", name: "Head Tag" }),
  BALANCE: Object.freeze({ id: "balance", name: "Balance" }),
  INCOME: Object.freeze({ id: "income", name: "Income" }),
  EXPENSE: Object.freeze({ id: "expense", name: "Expense" }),
  CUSTOM: Object.freeze({ id: "custom", name: "Custom" }),
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
  ProfileAccess,
  ProfileState,
  EntryType,
  EntryFieldState,
  TriggerType,
  TriggerState,
  AggregationName,
  CoinLedgerRef,
  CoinLedgerType,
};
