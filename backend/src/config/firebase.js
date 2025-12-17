import admin from "firebase-admin";

let messaging = null;
function initialise() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
  messaging = admin.messaging();
  console.log(
    `🚀 Firebase Admin SDK initialized (${process.env.GOOGLE_CLOUD_PROJECT})`,
  );
}

function getMessaging() {
  return messaging;
}

export {
  initialise as initialiseFirebaseAdmin,
  admin as firebaseAdmin,
  getMessaging,
};
