import mongoose from "mongoose";

const saveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coordImageUrl: {
      type: String,
      required: true,
    },
    sourceUploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: true,
    },
  },
  { timestamps: true },
);

export const Save = mongoose.model("Save", saveSchema);
