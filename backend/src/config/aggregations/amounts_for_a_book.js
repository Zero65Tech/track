import { EntryType } from "@shared/enums";

export default (profileId, { bookId }) => [
  {
    $match: {
      profileId,
      bookId,
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
            _id: {
              month: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$date",
                },
              },
              type: "$type",
              headId: "$headId",
              tagId: "$tagId",
            },
            amount: { $sum: "$amount" },
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
            _id: {
              month: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$date",
                },
              },
              type: "$type",
              headId: "$headId",
              tagId: "$tagId",
            },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ],
      relocateTo: [
        {
          $match: { type: EntryType.RELOCATE.id },
        },
        {
          _id: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$date",
              },
            },
            type: "$type",
            headId: "$headId",
            tagId: "$tagId",
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
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
