import mongoose from "mongoose";
import { EntryFieldState } from "@zero65/track";

function createSchema(collectionName) {
  const fields = {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },

    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },

    group: {
      type: String,
    },

    sortOrder: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(EntryFieldState).map((s) => s.id),
      required: true,
    },
  };

  if (collectionName === "books") {
    delete fields["group"];
  }

  return new mongoose.Schema(fields, {
    collection: collectionName,
    versionKey: false,
    timestamps: true,
  });
}

const BookModel = mongoose.model("Book", createSchema("books"));
const HeadModel = mongoose.model("Head", createSchema("heads"));
const TagModel = mongoose.model("Tag", createSchema("tags"));
const SourceModel = mongoose.model("Source", createSchema("sources"));

export { BookModel, HeadModel, TagModel, SourceModel };
