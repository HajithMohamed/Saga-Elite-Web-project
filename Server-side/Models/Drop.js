// models/Drop.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const dropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    releaseDate: {
      type: Date,
      required: true,
    },

    endDate: Date,

    isPublished: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* Auto slug generation (regenerates on name change) */
dropSchema.pre("save", async function () {
  if (this.isNew || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

/* Virtual populate for images (excludes soft-deleted) */
dropSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "refId",
  match: { isDeleted: false },
});

dropSchema.set("toObject", { virtuals: true });
dropSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Drop", dropSchema);