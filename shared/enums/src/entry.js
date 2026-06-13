// prettier-ignore
export const EntryType = Object.freeze({

  INCOME: Object.freeze({ id: "income", name: "Income", sign: "positive" }),
  INCOME_TAX: Object.freeze({ id: "income_tax", name: "Income Tax", sign: "negative" }),
  INCOME_TAX_REFUND: Object.freeze({ id: "income_tax_refund", name: "Income Tax:Refund", sign: "positive" }),
  EXPENSE: Object.freeze({ id: "expense", name: "Expense", sign: "negative" }),
  EXPENSE_REFUND: Object.freeze({ id: "expense_refund", name: "Expense:Refund", sign: "positive" }),
  LOAN_GIVEN: Object.freeze({ id: "loan_given", name: "Loan:Given", sign: "negative" }),
  LOAN_TAKEN: Object.freeze({ id: "loan_taken", name: "Loan:Taken", sign: "positive" }),
  INVESTMENT_DEPOSIT: Object.freeze({ id: "investment_deposit", name: "Investment:Deposit", sign: "negative" }),
  INVESTMENT_WITHDRAWAL: Object.freeze({ id: "investment_withdrawal", name: "Investment:Withdrawal", sign: "positive" }),
  POSITION_ONBOARD: Object.freeze({ id: "position_onboard", name: "Position:Onboard", sign: "positive" }),
  POSITION_OFFBOARD: Object.freeze({ id: "position_offboard", name: "Position:Offboard", sign: "negative" }),

  RELOCATE: Object.freeze({ id: "relocate", name: "Relocate", sign: "neutral" }),
  
  PAYMENT: Object.freeze({ id: "payment", name: "Payment", sign: "negative" }),
  RECEIPT: Object.freeze({ id: "receipt", name: "Receipt", sign: "positive" }),

  TRANSFER: Object.freeze({ id: "transfer", name: "Transfer", sign: "neutral" }),

  // TODO: Deprecate
  CREDIT: Object.freeze({ id: "credit", name: "Credit", sign: "positive" }),
  DEBIT: Object.freeze({ id: "debit", name: "Debit", sign: "negative" }),
  TAX: Object.freeze({ id: "tax", name: "Tax", sign: "negative" }),
  REFUND: Object.freeze({ id: "refund", name: "Refund", sign: "positive" }),
});

export const EntryState = Object.freeze({
  DRAFT: Object.freeze({
    id: "draft",
    name: "Draft",
  }),
  FORECAST: Object.freeze({
    id: "forecast",
    name: "Forecast",
  }),
  PLANNED: Object.freeze({
    id: "planned",
    name: "Planned",
  }),
  SETTLED: Object.freeze({
    id: "settled",
    name: "Settled",
  }),
});
