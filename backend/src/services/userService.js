import { LRUCache } from "lru-cache";
import { lruCacheConfig } from "../config/cache.js";
import { firebaseAdmin, getMessaging } from "../config/firebase.js";
import { getFcmTokens } from "./userFcmTokenService.js";

const cache = new LRUCache(lruCacheConfig);

async function _getCachedUser(uid) {
  let data = cache.get(uid);
  if (!data) {
    data = await firebaseAdmin.auth().getUser(uid);
    cache.set(uid, data);
  }
  return data;
}

async function _sendFcmNotification(userIds, messageData) {
  const fcmTokens = await getFcmTokens(...userIds);

  if (fcmTokens.length === 0) return;

  const messaging = getMessaging();

  for (const token of fcmTokens) {
    try {
      await messaging.send({
        token,
        data: messageData,
      });
    } catch (error) {
      console.warn(
        `⚠️  Failed to send to token (${token.substring(0, 10)}...):`,
        error.message,
      );
    }
  }
}

export { _getCachedUser, _sendFcmNotification };
