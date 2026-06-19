import { getFcmToken } from '@/config/firebaseClient';

let fcmTokenRefreshCallback = null;
async function onFcmTokenRefresh(callback) {
    fcmTokenRefreshCallback = callback;
}

const dataTypeCallbackMap = {};
async function onAsyncResponse(dataType, callback) {
    dataTypeCallbackMap[dataType] = callback;
}

// NOTE: { onMessage } from 'firebase/messaging' can not send backgroud messages
navigator.serviceWorker.onmessage = async (event) => {
    const { type } = event.data.data;

    if (type === 'FCM_TOKEN_REFRESH') {
        if (fcmTokenRefreshCallback) {
            const fcmToken = await getFcmToken();
            console.log(fcmToken, event.data.data);
            fcmTokenRefreshCallback(fcmToken);
        }
    }

    const { profileId, ...asyncResponse } = event.data.data;
    for (const [dataType, responseData] of Object.entries(asyncResponse)) {
        if (dataTypeCallbackMap[dataType]) {
            dataTypeCallbackMap[dataType](profileId, JSON.parse(responseData));
        }
    }
};

export default { onFcmTokenRefresh, onAsyncResponse };
