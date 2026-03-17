export default (profileId, { type }) => [
  {
    $match: {
      profileId,
      type,
    },
  },
  {
    $group: {
      _id: {
        month: { $substr: ["$date", 0, 7] },
        bookId: "$bookId",
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
      bookId: "$_id.bookId",
      headId: "$_id.headId",
      tagId: "$_id.tagId",
      count: 1,
      amount: 1,
    },
  },
];
