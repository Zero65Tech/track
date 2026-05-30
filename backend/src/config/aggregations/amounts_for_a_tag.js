import { EntryState, EntryType } from "@shared/enums";

export default (profileId, { tagId }) => [
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
      tagId,
      state: EntryState.SETTLED.id,
    },
  },
  {
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        type: "$type",
        bookId: "$bookId",
        headId: "$headId",
      },
      count: { $sum: 1 },
      amount: { $sum: "$amount" },
    },
  },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      type: "$_id.type",
      bookId: "$_id.bookId",
      headId: "$_id.headId",
      count: 1,
      amount: 1,
    },
  },
  {
    $sort: { "_id.month": 1, "_id.type": 1, "_id.bookId": 1, "_id.headId": 1 },
  },
];
