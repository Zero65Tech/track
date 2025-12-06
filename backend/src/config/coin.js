import _ from "lodash";

export default {
  signupBonus: { pulse: 0, nova: 1000 },

  aggregation: (entriesProcessed) =>
    Math.max(1, _.round(entriesProcessed / 1000, 2)),
};
