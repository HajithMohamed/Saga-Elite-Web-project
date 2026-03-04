// models/Drop.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const dropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      index: true
    },

    description: String,

    releaseDate: {
      type: Date,
      required: true
    },

    endDate: Date,

    isPublished: {
      type: Boolean,
      default: false
    },

    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/* Auto slug generation */
dropSchema.pre("save", function () {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

/* Virtual populate for images */
dropSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "refId"
});

dropSchema.set("toObject", { virtuals: true });
dropSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Drop", dropSchema);