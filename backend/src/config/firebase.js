import admin from "firebase-admin";

let auth = null;
let messaging = null;

function initialiseFirebase() {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    credential: admin.credential.applicationDefault(),
  });
  auth = admin.auth();
  messaging = admin.messaging();
  console.log(
    `🚀 Firebase Admin SDK initialized (${process.env.GOOGLE_CLOUD_PROJECT})`,
  );
}

function getFirebaseAuth() {
  return auth;
}

function getFirebaseMessaging() {
  return messaging;
}

export { initialiseFirebase, getFirebaseAuth, getFirebaseMessaging };
