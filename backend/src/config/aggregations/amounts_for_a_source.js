import { EntryState, EntryType } from "@shared/enums";

export default (profileId, { sourceId }) => [
  {
    $match: {
      profileId,
      $or: [
        {
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
            ],
          },
          sourceId,
        },
        { type: EntryType.TRANSFER.id, sourceIdFrom: sourceId },
        { type: EntryType.TRANSFER.id, sourceIdTo: sourceId },
      ],
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
    $addFields: {
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
          },
        },
        {
          $group: {
            _id: "$week",
            count: { $sum: 1 },
            amount: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$type",
                      [
                        EntryType.CREDIT.id,
                        EntryType.INCOME.id,
                        EntryType.EXPENSE.id,
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
          $match: { type: EntryType.TRANSFER.id, sourceIdFrom: sourceId },
        },
        {
          $group: {
            _id: "$week",
            count: { $sum: 1 },
            amount: { $sum: { $multiply: ["$amount", -1] } },
          },
        },
      ],
      transferTo: [
        {
          $match: { type: EntryType.TRANSFER.id, sourceIdTo: sourceId },
        },
        {
          $group: {
            _id: "$week",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
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
      amount: { $sum: "$allResults.amount" },
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
