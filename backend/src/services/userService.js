import { LRUCache } from "lru-cache";
import { lruCacheConfig } from "../config/cache.js";
import { firebaseAdmin } from "../config/firebase.js";

const cache = new LRUCache(lruCacheConfig);

async function _getCached(uid) {
  let data = cache.get(uid);
  if (!data) {
    data = await firebaseAdmin.auth().getUser(uid);
    cache.set(uid, data);
  }
  return data;
}

export default { _getCached };
