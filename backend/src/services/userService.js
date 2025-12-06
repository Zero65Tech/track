import { LRUCache } from "lru-cache";
import admin from "../config/firebase.js";

const cache = new LRUCache({
  max: 1024,
  ttl: 1000 * 60 * 60 * 3, // 3 hours
});

async function _getCached(uid) {
  let data = cache.get(uid);
  if (!data) {
    data = await admin.auth().getUser(uid);
    cache.set(uid, data);
  }
  return data;
}

export default { _getCached };
