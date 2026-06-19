import fcmClient from '@/service/fcmClient';

export const fcmService = {
    onFcmTokenRefresh(callback) {
        fcmClient.onFcmTokenRefresh(callback);
    }
};
