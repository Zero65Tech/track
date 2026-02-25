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
            count: { $sum: 1 },
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
            balance: { $sum: { $multiply: ["$amount", -1] } },
            count: { $sum: 1 },
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
            balance: { $sum: "$amount" },
            count: { $sum: 1 },
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
      balance: { $sum: "$allResults.balance" },
      count: { $sum: "$allResults.count" },
    },
  },
  {
    $sort: { "_id.week": 1 },
  },
];
