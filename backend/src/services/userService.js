import _ from "lodash";
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

async function _sendFirebaseMessage(userIds, notification, data) {
  const fcmTokens = await _getActiveDeviceFcmTokens(...userIds);
  if (fcmTokens.length === 0) {
    return;
  }

  const messaging = getFirebaseMessaging();
  for (const fcmToken of _.uniq(fcmTokens)) {
    try {
      await messaging.send({ token: fcmToken, notification, data });
    } catch (error) {
      if (error.code === "messaging/registration-token-not-registered") {
        console.log(`Deactivating devices with fcmToken ${fcmToken}`);
        await _deactivateDevicesByFcmToken(fcmToken);
      } else {
        throw error;
      }
    }
  }
}

export { _getCachedUser, _sendFirebaseMessage };
