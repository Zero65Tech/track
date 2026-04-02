import { EntryState, EntryType } from "@shared/enums";

export default (profileId, { headId }) => [
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
      headId,
      state: EntryState.SETTLED.id,
    },
  },
  {
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        type: "$type",
        bookId: "$bookId",
        tagId: "$tagId",
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
      tagId: "$_id.tagId",
      count: 1,
      amount: 1,
    },
  },
];
