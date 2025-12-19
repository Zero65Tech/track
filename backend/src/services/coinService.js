import { LRUCache } from "lru-cache";
import { CoinLedgerType } from "@shared/enums";

import { lruCacheConfig } from "../config/cache.js";
import { signupBonusCoins } from "../config/coin.js";

import CoinModel from "../models/Coin.js";

const coinLedgerBalanceCache = new LRUCache(lruCacheConfig);

async function _getCoinLedgerBalance(profileId) {
  if (typeof profileId !== "string") {
    profileId = profileId.toString();
  }

  let balance = coinLedgerBalanceCache.get(profileId);
  if (balance === undefined) {
    const latestTxn = await CoinModel.findOne({
      profileId,
      latest: true,
    });

    coinLedgerBalanceCache.set(profileId, {
      pulse: latestTxn.pulseTotal,
      nova: latestTxn.novaTotal,
      total: latestTxn.pulseTotal + latestTxn.novaTotal,
    });
  }

  return balance;
}

async function _setCoinLedgerBalance(profileId, pulseTotal, novaTotal) {
  if (typeof profileId !== "string") {
    profileId = profileId.toString();
  }

  coinLedgerBalanceCache.set(profileId, {
    pulse: pulseTotal,
    nova: novaTotal,
    total: pulseTotal + novaTotal,
  });
}

async function _initialiseCoinLedger({ profileId, ref }, session) {
  await CoinModel.create(
    [
      {
        profileId,
        ref,
        type: CoinLedgerType.SIGNUP_BONUS.id,
        pulse: 0,
        nova: signupBonusCoins.nova,
        pulseTotal: 0,
        novaTotal: signupBonusCoins.nova,
        latest: true,
      },
    ],
    { session },
  );

  _setCoinLedgerBalance(profileId, 0, signupBonusCoins.nova);
}

async function _deductCoinsFromLedger(
  { profileId, ref, type, coinsToDeduct },
  session,
) {
  let latestTxn = await CoinModel.findOne({ profileId, latest: true }).session(
    session,
  );

  let pulseTotal = latestTxn.pulseTotal;
  let novaTotal = latestTxn.novaTotal;

  let pulseDeducted = 0;
  let novaDeducted = 0;

  if (pulseTotal > 0) {
    pulseDeducted = Math.min(pulseTotal, coinsToDeduct);
    coinsToDeduct = coinsToDeduct - pulseDeducted;
  }

  if (coinsToDeduct && novaTotal) {
    novaDeducted = Math.min(novaTotal, coinsToDeduct);
    coinsToDeduct = coinsToDeduct - novaDeducted;
  }

  if (coinsToDeduct) {
    pulseDeducted = pulseDeducted + coinsToDeduct;
    coinsToDeduct = 0;
  }

  latestTxn.latest = false;
  await latestTxn.save({ session });

  latestTxn = await CoinModel.create(
    [
      {
        profileId,
        ref,
        type,
        pulse: -pulseDeducted,
        nova: -novaDeducted,
        pulseTotal: pulseTotal - pulseDeducted,
        novaTotal: novaTotal - novaDeducted,
        latest: true,
      },
    ],
    { session },
  );

  _setCoinLedgerBalance(profileId, latestTxn.pulseTotal, latestTxn.novaTotal);
}

export { _getCoinLedgerBalance, _initialiseCoinLedger, _deductCoinsFromLedger };
