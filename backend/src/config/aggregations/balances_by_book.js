import { EntryType } from "@zero65/track";

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
    $facet: {
      bookEntries: [
        {
          $match: {
            type: {
              $not: { $eq: EntryType.RELOCATE.id },
            },
          },
        },
        {
          $group: {
            _id: "$bookId",
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
      relocateFrom: [
        {
          $match: { type: EntryType.RELOCATE.id },
        },
        {
          $group: {
            _id: "$bookIdFrom",
            balance: { $sum: { $multiply: ["$amount", -1] } },
            count: { $sum: 1 },
          },
        },
      ],
      relocateTo: [
        {
          $match: { type: EntryType.RELOCATE.id },
        },
        {
          $group: {
            _id: "$bookIdTo",
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
        $concatArrays: ["$bookEntries", "$relocateFrom", "$relocateTo"],
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
];
