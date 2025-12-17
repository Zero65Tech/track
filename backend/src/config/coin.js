import _ from "lodash";

const signupBonusCoins = { pulse: 0, nova: 1000 };

function calculateAggregationCoins(entriesProcessed) {
  return Math.max(1, _.round(entriesProcessed / 1000, 2));
}

export { signupBonusCoins, calculateAggregationCoins };
