import { EntryType } from "@shared/enums";

export default (profileId) => [
  {
    $match: {
      profileId,
      type: {
        $in: [EntryType.EXPENSE.id, EntryType.REFUND.id],
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
        bookId: "$bookId",
        tagId: "$tagId",
        month: {
          $dateToString: {
            format: "%Y-%m",
            date: "$date",
          },
        },
      },
      balance: {
        $sum: {
          $cond: [
            { $eq: ["$type", EntryType.EXPENSE.id] },
            "$amount",
            { $multiply: ["$amount", -1] },
          ],
        },
      },
      count: { $sum: 1 },
    },
  },
  {
    $sort: { "_id.bookId": 1, "_id.tagId": 1, "_id.month": 1 },
  },
];
