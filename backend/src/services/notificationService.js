import _ from "lodash";
import { getFirebaseMessaging } from "../config/firebase.js";
import {
  _getActiveDeviceFcmTokens,
  _deactivateDevicesByFcmToken,
} from "./deviceService.js";
import { _getCachedProfile } from "./profileService.js";

async function _notifyTriggerUpdate(triggerData) {
  const profileId = triggerData.profileId.toString();

  const profile = await _getCachedProfile(profileId);
  const userIds = [profile.owner, ...profile.editors, ...profile.viewers];

  const fcmTokens = await _getActiveDeviceFcmTokens(...userIds);
  if (fcmTokens.length === 0) {
    return;
  }

  triggerData = {
    ...triggerData,
    _id: undefined,
    id: triggerData._id.toString(),
  };

  const messaging = getFirebaseMessaging();
  for (const fcmToken of _.uniq(fcmTokens)) {
    try {
      await messaging.send({
        token: fcmToken,
        notification: {},
        data: { profileId, trigger: JSON.stringify(triggerData) },
      });
      console.log(
        `Sent FCM message to token ${fcmToken} for trigger ${triggerData.id}`,
      );
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

export { _notifyTriggerUpdate };
