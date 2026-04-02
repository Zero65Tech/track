import { EntryState, EntryType } from "@shared/enums";

export default (profileId) => [
  {
    $match: {
      profileId,
      type: {
        $in: [
          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.INCOME.id,
          EntryType.EXPENSE.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,
        ],
      },
      state: EntryState.SETTLED.id,
    },
  },
  {
    $group: {
      _id: "$type",
      amount: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
];
