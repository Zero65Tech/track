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
          EntryType.PAYMENT.id,
          EntryType.RECEIPT.id,
          EntryType.TRANSFER.id,
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
    $facet: {
      sourceEntries: [
        {
          $match: {
            type: {
              $not: { $eq: EntryType.TRANSFER.id },
            },
            sourceId: { $exists: true, $ne: null },
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
              sourceId: "$sourceId",
            },
            count: { $sum: 1 },
            balance: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$type",
                      [
                        EntryType.CREDIT.id,
                        EntryType.INCOME.id,
                        EntryType.REFUND.id,
                        EntryType.RECEIPT.id,
                      ],
                    ],
                  },
                  "$amount",
                  { $multiply: ["$amount", -1] },
                ],
              },
            },
          },
        },
      ],
      transferFrom: [
        {
          $match: { type: EntryType.TRANSFER.id },
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
              sourceId: "$sourceIdFrom",
            },
            count: { $sum: 1 },
            balance: { $sum: { $multiply: ["$amount", -1] } },
          },
        },
      ],
      transferTo: [
        {
          $match: { type: EntryType.TRANSFER.id },
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
              sourceId: "$sourceIdTo",
            },
            count: { $sum: 1 },
            balance: { $sum: "$amount" },
          },
        },
      ],
    },
  },
  {
    $project: {
      allResults: {
        $concatArrays: ["$sourceEntries", "$transferFrom", "$transferTo"],
      },
    },
  },
  {
    $unwind: "$allResults",
  },
  {
    $group: {
      _id: "$allResults._id",
      count: { $sum: "$allResults.count" },
      balance: { $sum: "$allResults.balance" },
    },
  },
  {
    $project: {
      _id: 0,
      week: "$_id.week",
      sourceId: "$_id.sourceId",
      count: 1,
      balance: 1,
    },
  },
];
