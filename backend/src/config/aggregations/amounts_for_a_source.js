import { EntryState, EntryType } from "@shared/enums";

export default (profileId, { sourceId }) => [
  {
    $match: {
      profileId,
      $or: [
        {
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
            amount: { $sum: "$amount" },
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
