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
    $addFields: {
      date: {
        $dateFromString: { dateString: "$date" },
      },
    },
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateSubtract: {
              startDate: "$date",
              unit: "day",
              amount: { $subtract: [{ $isoDayOfWeek: "$date" }, 1] },
            },
          },
        },
      },
      count: { $sum: 1 },
      amount: { $sum: "$amount" },
    },
  },
  {
    $project: {
      _id: 0,
      week: "$_id",
      count: 1,
      amount: 1,
    },
  },
  {
    $sort: { week: 1 },
  },
];
