import express from "express";

import accessMiddleware from "./middlewares/access.js";
import authMiddleware from "./middlewares/auth.js";

import aggregationController from "./controllers/aggregationController.js";
import auditLogController from "./controllers/auditLogController.js";
import bookController from "./controllers/bookController.js";
import deviceController from "./controllers/deviceController.js";
import entryController from "./controllers/entryController.js";
import folderController from "./controllers/folderController.js";
import groupController from "./controllers/groupController.js";
import headController from "./controllers/headController.js";
import profileController from "./controllers/profileController.js";
import sourceController from "./controllers/sourceController.js";
import tagController from "./controllers/tagController.js";
import triggerController from "./controllers/triggerController.js";

const app = express();
app.use(express.json());

let API_PREFIX = "/api";

app.post(`${API_PREFIX}/devices`, deviceController.createDevice);
app.patch(`${API_PREFIX}/devices/:deviceId`, deviceController.updateDevice);

app.get(`${API_PREFIX}/profiles/templates/system`, profileController.getTemplateProfiles); // prettier-ignore

app.get(`${API_PREFIX}/triggers/process`, triggerController.processTriggers);

// NOTE: USER MUST BE LOGGED IN FOR FOLLOWING ROUTES

app.use(authMiddleware);

app.get(`${API_PREFIX}/devices/:deviceId/claim`, deviceController.claimDevice);

app.get(`${API_PREFIX}/profiles`, profileController.getAccessibleProfiles);
app.post(`${API_PREFIX}/profiles`, profileController.createProfile);

// NOTE: LOGGED-IN USER MUST HAVE ACCESS TO THE PROFILE FOR FOLLOWING ROUTES

API_PREFIX = "/api/profiles/:profileId";

app.use(API_PREFIX, accessMiddleware);

app.patch(API_PREFIX, profileController.updateProfile);

app.get(`${API_PREFIX}/books`, bookController.getBooks);
app.post(`${API_PREFIX}/books`, bookController.createBook);
app.patch(`${API_PREFIX}/books/:bookId`, bookController.updateBook);
app.delete(`${API_PREFIX}/books/:bookId`, bookController.deleteBook);

app.get(`${API_PREFIX}/heads`, headController.getHeads);
app.post(`${API_PREFIX}/heads`, headController.createHead);
app.patch(`${API_PREFIX}/heads/:headId`, headController.updateHead);
app.delete(`${API_PREFIX}/heads/:headId`, headController.deleteHead);

app.get(`${API_PREFIX}/tags`, tagController.getTags);
app.post(`${API_PREFIX}/tags`, tagController.createTag);
app.patch(`${API_PREFIX}/tags/:tagId`, tagController.updateTag);
app.delete(`${API_PREFIX}/tags/:tagId`, tagController.deleteTag);

app.get(`${API_PREFIX}/sources`, sourceController.getSources);
app.post(`${API_PREFIX}/sources`, sourceController.createSource);
app.patch(`${API_PREFIX}/sources/:sourceId`, sourceController.updateSource);
app.delete(`${API_PREFIX}/sources/:sourceId`, sourceController.deleteSource);

app.get(`${API_PREFIX}/entries`, entryController.getEntries);
app.get(`${API_PREFIX}/books/:bookId/entries`, entryController.getBookEntries);
app.get(`${API_PREFIX}/heads/:headId/entries`, entryController.getHeadEntries);
app.get(`${API_PREFIX}/tags/:tagId/entries`, entryController.getTagEntries);
app.get(`${API_PREFIX}/sources/:sourceId/entries`, entryController.getSourceEntries); // prettier-ignore
app.post(`${API_PREFIX}/entries`, entryController.createEntry);
app.patch(`${API_PREFIX}/entries/:entryId`, entryController.updateEntry);
app.delete(`${API_PREFIX}/entries/:entryId`, entryController.deleteEntry);

app.get(`${API_PREFIX}/groups`, groupController.getGroups);
app.post(`${API_PREFIX}/groups`, groupController.createGroup);
app.patch(`${API_PREFIX}/groups/:groupId`, groupController.updateGroup);
app.delete(`${API_PREFIX}/groups/:groupId`, groupController.deleteGroup);

app.get(`${API_PREFIX}/folders`, folderController.getFolders);
app.post(`${API_PREFIX}/folders`, folderController.createFolder);
app.patch(`${API_PREFIX}/folders/:folderId`, folderController.updateFolder);
app.delete(`${API_PREFIX}/folders/:folderId`, folderController.deleteFolder);

app.get(`${API_PREFIX}/audit-logs`, auditLogController.getAuditLogs);

app.get(`${API_PREFIX}/triggers`, triggerController.getTriggers);
app.post(`${API_PREFIX}/triggers/data-aggregation`, triggerController.createDataAggregationTrigger); // prettier-ignore

app.get(`${API_PREFIX}/aggregations/:aggregationName/result`, aggregationController.getAggregationResult); // prettier-ignore

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json(err.message || "Internal Server Error");
  next();
});

export default app;
