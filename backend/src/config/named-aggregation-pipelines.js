const configs = {
  // TODO: Move this enum
  "head-tag": {
    match: {
      type: ["credit", "debit", "income", "expense", "refund", "tax"],
    },
    group: ["headId", "tagId"],
  },
};

export default function (profileId, name) {
  const config = configs[name];

  const $match = { profileId };
  for (let [key, value] of Object.entries(config.match))
    $match[key] = typeof value === "string" ? value : { $in: value };

  const $group = { _id: {}, count: { $sum: 1 }, amount: { $sum: "$amount" } };
  for (let key of config.group) $group._id[key] = `$${key}`;

  return [{ $match }, { $group }];
}
