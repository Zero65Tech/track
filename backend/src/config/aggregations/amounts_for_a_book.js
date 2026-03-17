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
        ],
      },
    },
  },
  {
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        type: "$type",
        headId: "$headId",
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
      headId: "$_id.headId",
      tagId: "$_id.tagId",
      count: 1,
      amount: 1,
    },
  },
];
