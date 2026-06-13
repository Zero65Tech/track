export { ProfileAccess, ProfileState } from "./profile.js";

const DataSource = Object.freeze({
  BACKEND_SERVICE_V5_5: "Backend Service v5.5",
  MIGRATION_SCRIPT_V1_0: "Migration Script v1.0",
});

export { EntryState, EntryType } from "./entry.js";

export { AttributeState } from "./attributes.js";

export { TriggerState, TriggerType } from "./trigger.js";

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

export { CoinLedgerRef, CoinLedgerType } from "./coin.js";

export { AggregationName, DataSource };
