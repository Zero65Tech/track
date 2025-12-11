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
        ],
      },
    },
  },
  {
    $group: {
      _id: { headId: "$headId", tagId: "$tagId" },
      count: { $sum: 1 },
    },
  },
];
