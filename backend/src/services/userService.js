import { LRUCache } from "lru-cache";
import { lruCacheConfig } from "../config/cache.js";
import { getFirebaseAuth, getFirebaseMessaging } from "../config/firebase.js";
import { _getFcmTokens } from "./userFcmTokenService.js";

const userCache = new LRUCache(lruCacheConfig);

async function _getCachedUser(userId) {
  let data = userCache.get(userId);
  if (!data) {
    data = await getFirebaseAuth().getUser(userId);
    userCache.set(userId, data);
  }
  return data;
}

async function _sendFcmNotification(userIds, messageData) {
  const fcmTokens = await _getFcmTokens(...userIds);
  if (fcmTokens.length === 0) {
    return;
  }

  const messaging = getFirebaseMessaging();
  for (const token of fcmTokens) {
    await messaging.send({
      token,
      data: messageData,
    });
  }
}

export { _getCachedUser, _sendFcmNotification };
