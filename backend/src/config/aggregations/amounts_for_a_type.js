export default (profileId, type) => [
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
      amount: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      bookId: "$_id.bookId",
      headId: "$_id.headId",
      tagId: "$_id.tagId",
      amount: 1,
      count: 1,
    },
  },
];
