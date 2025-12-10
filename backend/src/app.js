import express from "express";
import fs from "fs";
import path from "path";

import _ from "lodash";

import idMappings from "./config/idMappings.js";

import authMiddleware from "./middlewares/auth.js";
import accessMiddleware from "./middlewares/access.js";

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
import cronController from "./controllers/cronController.js";
import triggerController from "./controllers/triggerController.js";
import aggregationController from "./controllers/aggregationController.js";

const app = express();
app.use(express.json());

app.param("profileId", (req, res, next, profileId) => {
  if (profileId.startsWith("$"))
    req.params.profileId =
      _.get(idMappings, req.params.profileId.substring(1)) ||
      req.params.profileId;
  next();
});

app.use((req, res, next) => {
  if (req.body) {
    if ("_id" in req.body) delete req.body._id;
    if ("profileId" in req.body) delete req.body.profileId;
    if ("bookId" in req.body && req.body.bookId.startsWith("$"))
      req.body.bookId =
        _.get(idMappings, req.body.bookId.substring(1)) || req.body.bookId;
    if ("headId" in req.body && req.body.headId.startsWith("$"))
      req.body.headId =
        _.get(idMappings, req.body.headId.substring(1)) || req.body.headId;
    if ("tagId" in req.body && req.body.tagId.startsWith("$"))
      req.body.tagId =
        _.get(idMappings, req.body.tagId.substring(1)) || req.body.tagId;
  }

  next();
});

app.get(`/api/ls`, (req, res) => {
  try {
    const files = fs.readdirSync(".");
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let API_PREFIX = "/api";

app.get(`${API_PREFIX}/profiles/templates/system`, profileController.getTemplatesBySystem); // prettier-ignore
app.get(`${API_PREFIX}/cron`, cronController);

// NOTE: User must be loggedin for following routes

app.use(authMiddleware);

app.get(`${API_PREFIX}/profiles`, profileController.getAllAccessible);
app.post(`${API_PREFIX}/profiles`, profileController.create);
app.patch(`${API_PREFIX}/profiles/:id`, profileController.update);

// NOTE: Loggedin User must have access to the Profile for following routes

API_PREFIX = "/api/profiles/:profileId";

app.use(API_PREFIX, accessMiddleware);

app.get(`${API_PREFIX}/books`, bookController.getAll);
app.post(`${API_PREFIX}/books`, bookController.create);
app.patch(`${API_PREFIX}/books/:id`, bookController.update);
app.delete(`${API_PREFIX}/books/:id`, bookController.remove);

app.get(`${API_PREFIX}/heads`, headController.getAll);
app.post(`${API_PREFIX}/heads`, headController.create);
app.patch(`${API_PREFIX}/heads/sortOrder`, headController.bulkUpdateSortOrder);
app.patch(`${API_PREFIX}/heads/:id`, headController.update);
app.delete(`${API_PREFIX}/heads/:id`, headController.remove);

app.get(`${API_PREFIX}/tags`, tagController.getAll);
app.post(`${API_PREFIX}/tags`, tagController.create);
app.patch(`${API_PREFIX}/tags/sortOrder`, tagController.bulkUpdateSortOrder);
app.patch(`${API_PREFIX}/tags/:id`, tagController.update);
app.delete(`${API_PREFIX}/tags/:id`, tagController.remove);

app.get(`${API_PREFIX}/sources`, sourceController.getAll);
app.post(`${API_PREFIX}/sources`, sourceController.create);
app.patch(`${API_PREFIX}/sources/sortOrder`, sourceController.bulkUpdateSortOrder); // prettier-ignore
app.patch(`${API_PREFIX}/sources/:id`, sourceController.update);
app.delete(`${API_PREFIX}/sources/:id`, sourceController.remove);

app.get(`${API_PREFIX}/folders`, folderController.getAll);
app.post(`${API_PREFIX}/folders`, folderController.create);
app.patch(`${API_PREFIX}/folders/:id`, folderController.update);
app.delete(`${API_PREFIX}/folders/:id`, folderController.remove);

app.get(`${API_PREFIX}/groups`, groupController.getAll);
app.post(`${API_PREFIX}/groups`, groupController.create);
app.patch(`${API_PREFIX}/groups/:id`, groupController.update);
app.delete(`${API_PREFIX}/groups/:id`, groupController.remove);

app.get(`${API_PREFIX}/entries`, entryController.getAll);
app.post(`${API_PREFIX}/entries`, entryController.create);
app.patch(`${API_PREFIX}/entries/:id`, entryController.update);
app.delete(`${API_PREFIX}/entries/:id`, entryController.remove);

app.get(`${API_PREFIX}/audit-logs`, auditLogController.getAll);

app.post(`${API_PREFIX}/triggers`, triggerController.create);

app.get(`${API_PREFIX}/aggregations/named/:name/result`, aggregationController.getNamedResult); // prettier-ignore
app.get(`${API_PREFIX}/aggregations/custom/:id/result`, aggregationController.getCustomResult); // prettier-ignore
app.post(`${API_PREFIX}/aggregations/custom/pipeline`, aggregationController.createCustomPipeline); // prettier-ignore

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json(err.message || "Internal Server Error");
  next();
});

export default app;
