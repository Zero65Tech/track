import { EntryType } from "@shared/enums";

export default (profileId, headId) => [
  {
    $match: {
      profileId,
      headId,
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
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        type: "$type",
        bookId: "$bookId",
        tagId: "$tagId",
      },
      amount: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      type: "$_id.type",
      bookId: "$_id.bookId",
      tagId: "$_id.tagId",
      amount: 1,
      count: 1,
    },
  },
];
