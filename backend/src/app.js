import express from "express";

import authMiddleware from "./middlewares/auth.js";
import accessMiddleware from "./middlewares/access.js";

import deviceController from "./controllers/deviceController.js";
import profileController from "./controllers/profileController.js";
import {
  bookController,
  headController,
  tagController,
  sourceController,
} from "./controllers/EntryFields.js";
import folderController from "./controllers/folderController.js";
import groupController from "./controllers/groupController.js";
import entryController from "./controllers/entryController.js";
import auditLogController from "./controllers/auditLogController.js";
import triggerController from "./controllers/triggerController.js";
import aggregationController from "./controllers/aggregationController.js";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (req.body) {
    if ("_id" in req.body) delete req.body._id;
    if ("profileId" in req.body) delete req.body.profileId;
  }
  next();
});

let API_PREFIX = "/api";

app.post(`${API_PREFIX}/devices`, deviceController.createDevice);
app.patch(`${API_PREFIX}/devices/:id`, deviceController.updateDevice);

app.get(`${API_PREFIX}/profiles/templates/system`, profileController.getTemplateProfiles); // prettier-ignore

// NOTE: User must be loggedin for following routes

app.use(authMiddleware);

app.get(`${API_PREFIX}/devices/:id/claim`, deviceController.claimDevice);

app.get(`${API_PREFIX}/profiles`, profileController.getAccessibleProfiles);
app.post(`${API_PREFIX}/profiles`, profileController.createProfile);
app.patch(`${API_PREFIX}/profiles/:id`, profileController.updateProfile);

// NOTE: Loggedin User must have access to the Profile for following routes

API_PREFIX = "/api/profiles/:profileId";

app.use(API_PREFIX, accessMiddleware);

app.get(`${API_PREFIX}/books`, bookController.getAll);
app.post(`${API_PREFIX}/books`, bookController.create);
app.patch(`${API_PREFIX}/books/:id`, bookController.update);
app.delete(`${API_PREFIX}/books/:id`, bookController.remove);

app.get(`${API_PREFIX}/heads`, headController.getAll);
app.post(`${API_PREFIX}/heads`, headController.create);
app.patch(`${API_PREFIX}/heads/:id`, headController.update);
app.delete(`${API_PREFIX}/heads/:id`, headController.remove);

app.get(`${API_PREFIX}/tags`, tagController.getAll);
app.post(`${API_PREFIX}/tags`, tagController.create);
app.patch(`${API_PREFIX}/tags/:id`, tagController.update);
app.delete(`${API_PREFIX}/tags/:id`, tagController.remove);

app.get(`${API_PREFIX}/sources`, sourceController.getAll);
app.post(`${API_PREFIX}/sources`, sourceController.create);
app.patch(`${API_PREFIX}/sources/:id`, sourceController.update);
app.delete(`${API_PREFIX}/sources/:id`, sourceController.remove);

app.get(`${API_PREFIX}/folders`, folderController.getFolders);
app.post(`${API_PREFIX}/folders`, folderController.createFolder);
app.patch(`${API_PREFIX}/folders/:id`, folderController.updateFolder);
app.delete(`${API_PREFIX}/folders/:id`, folderController.deleteFolder);

app.get(`${API_PREFIX}/groups`, groupController.getGroups);
app.post(`${API_PREFIX}/groups`, groupController.createGroup);
app.patch(`${API_PREFIX}/groups/:id`, groupController.updateGroup);
app.delete(`${API_PREFIX}/groups/:id`, groupController.deleteGroup);

app.get(`${API_PREFIX}/entries`, entryController.getEntries);
app.get(`${API_PREFIX}/sources/:sourceId/entries`, entryController.getSourceEntries);
app.post(`${API_PREFIX}/entries`, entryController.createEntry);
app.patch(`${API_PREFIX}/entries/:id`, entryController.updateEntry);
app.delete(`${API_PREFIX}/entries/:id`, entryController.deleteEntry);

app.get(`${API_PREFIX}/audit-logs`, auditLogController.getAuditLogs);

app.post(`${API_PREFIX}/triggers/data-aggregation`, triggerController.createDataAggregationTrigger);

app.get(`${API_PREFIX}/aggregations/named/:name/result`, aggregationController.getNamedAggregationResult); // prettier-ignore
app.get(`${API_PREFIX}/aggregations/custom/:id/result`, aggregationController.getCustomAggregationResult); // prettier-ignore
app.post(`${API_PREFIX}/aggregations/custom/pipeline`, aggregationController.createCustomAggregation); // prettier-ignore

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json(err.message || "Internal Server Error");
  next();
});

export default app;
