import Coin from "../models/Coin.js";

import config from "../config/coin.js";

async function _initCoinLedger({ profileId }, session) {
  await Coin.create(
    [
      {
        profileId,
        type: "signup_bonus",
        pulse: 0,
        nova: config.signupBonus.nova,
        pulseTotal: 0,
        novaTotal: config.signupBonus.nova,
        latest: true,
      },
    ],
    { session },
  );
}

async function _deductCoin({ profileId, ref, type, countDeduct }, session) {
  let latestTxn = await Coin.findOne({ profileId, latest: true }).session(
    session,
  );

  let novaTotal = latestTxn.novaTotal;
  let pulseTotal = latestTxn.pulseTotal;

  let deductNova = 0;
  let deductPulse = 0;

  if (pulseTotal > 0) {
    deductPulse = Math.min(pulseTotal, countDeduct);
    countDeduct = countDeduct - deductPulse;
  }

  if (countDeduct && novaTotal) {
    deductNova = Math.min(novaTotal, countDeduct);
    countDeduct = countDeduct - deductNova;
  }

  if (countDeduct) {
    deductPulse = deductPulse + countDeduct;
    countDeduct = 0;
  }

  latestTxn.latest = false;
  await latestTxn.save({ session });

  latestTxn = await Coin.create(
    [
      {
        profileId,
        ref,
        type,
        nova: -deductNova,
        pulse: -deductPulse,
        novaTotal: novaTotal - deductNova,
        pulseTotal: pulseTotal - deductPulse,
        latest: true,
      },
    ],
    { session },
  );

  return latestTxn.novaTotal + latestTxn.pulseTotal;
}

export { _initCoinLedger, _deductCoin };
