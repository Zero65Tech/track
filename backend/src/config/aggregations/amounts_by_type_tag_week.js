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
        week: {
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
        type: "$type",
        tagId: "$tagId",
      },
      amount: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  {
    $sort: { "_id.week": 1, "_id.type": 1, "_id.tagId": 1 },
  },
];
