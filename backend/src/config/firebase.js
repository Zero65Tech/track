import admin from "firebase-admin";

function initialise() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
  console.log(
    `Firebase Admin SDK initialized (${process.env.GOOGLE_CLOUD_PROJECT}) 🔥`,
  );
}

export { initialise as initialiseFirebaseAdmin, admin as firebaseAdmin };
