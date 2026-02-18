import { EntryType } from "@shared/enums";

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
          EntryType.RELOCATE.id,
        ],
      },
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
        $dateAdd: {
          startDate: "$date",
          unit: "day",
          amount: { $subtract: [8, { $isoDayOfWeek: "$date" }] },
        },
      },
      balance: {
        $sum: {
          $cond: [
            {
              $in: ["$type", [EntryType.CREDIT.id, EntryType.INCOME.id, EntryType.REFUND.id]],
            },
            "$amount",
            { $multiply: ["$amount", -1] },
          ],
        },
      },
      count: { $sum: 1 },
    },
  },
  {
    $sort: { _id: 1 },
  },
];
