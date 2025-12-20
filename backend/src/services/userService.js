import { LRUCache } from "lru-cache";
import { lruCacheConfig } from "../config/cache.js";
import { getFirebaseAuth, getFirebaseMessaging } from "../config/firebase.js";
import {
  _getActiveDeviceFcmTokens,
  _deactivateDevicesByFcmToken,
} from "./deviceService.js";

const userDataCache = new LRUCache(lruCacheConfig);

async function _getCachedUser(userId) {
  let data = userDataCache.get(userId);
  if (!data) {
    data = await getFirebaseAuth().getUser(userId);
    userDataCache.set(userId, data);
  }
  return data;
}

async function _sendFcmNotification(userIds, messageData) {
  const fcmTokens = await _getActiveDeviceFcmTokens(...userIds);
  console.log(userIds, fcmTokens);
  if (fcmTokens.length === 0) {
    return;
  }
  // TODO: filter out invalid tokens before sending
  const messaging = getFirebaseMessaging();
  for (const fcmToken of fcmTokens) {
    try {
      await messaging.send({
        token: fcmToken,
        data: messageData,
      });
    } catch (error) {
      if (error.code === "messaging/registration-token-not-registered") {
        await _deactivateDevicesByFcmToken(fcmToken);
      } else {
        throw error;
      }
    }
  }
}

export { _getCachedUser, _sendFcmNotification };
