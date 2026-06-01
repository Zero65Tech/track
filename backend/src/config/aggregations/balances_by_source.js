import { EntryState, EntryType } from "@shared/enums";

export default (profileId) => [
  {
    $match: {
      profileId,
      type: {
        $in: [
          EntryType.INCOME.id,
          EntryType.INCOME_TAX.id,
          EntryType.INCOME_TAX_REFUND.id,
          EntryType.EXPENSE.id,
          EntryType.EXPENSE_REFUND.id,
          EntryType.LOAN_GIVEN.id,
          EntryType.LOAN_TAKEN.id,
          EntryType.INVESTMENT_DEPOSIT.id,
          EntryType.INVESTMENT_WITHDRAWAL.id,
          EntryType.POSITION_ONBOARD.id,
          EntryType.POSITION_OFFBOARD.id,

          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,

          EntryType.PAYMENT.id,
          EntryType.RECEIPT.id,
          EntryType.TRANSFER.id,
        ],
      },
      state: EntryState.SETTLED.id,
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
            _id: "$sourceId",
            balance: { $sum: "$amount" },
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
            _id: "$sourceIdFrom",
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
            _id: "$sourceIdTo",
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
    $sort: { _id: 1 },
  },
];
