import { EntryState, EntryType } from "@shared/enums";

export default (profileId) => [
  {
    $match: {
      profileId,
      type: {
        $in: [
          EntryType.INCOME.id,
          EntryType.INCOME_TAX.id,
          EntryType.INCOME_TAX_REFUND.id,
          EntryType.EXPENSE.id,
          EntryType.EXPENSE_REFUND.id,
          EntryType.LOAN_GIVEN.id,
          EntryType.LOAN_TAKEN.id,
          EntryType.INVESTMENT_DEPOSIT.id,
          EntryType.INVESTMENT_WITHDRAWAL.id,
          EntryType.POSITION_ONBOARD.id,
          EntryType.POSITION_OFFBOARD.id,

          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,
        ],
      },
      state: EntryState.SETTLED.id,
    },
  },
  {
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        type: "$type",
        bookId: "$bookId",
      },
      count: { $sum: 1 },
      amount: { $sum: "$amount" },
    },
  },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      type: "$_id.type",
      bookId: "$_id.bookId",
      count: 1,
      amount: 1,
    },
  },
  {
    $sort: { month: 1, type: 1, bookId: 1 },
  },
];
