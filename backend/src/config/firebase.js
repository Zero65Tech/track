import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

let auth = null;
let messaging = null;

function initialiseFirebase() {
  initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
  auth = getAuth();
  messaging = getMessaging();
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
