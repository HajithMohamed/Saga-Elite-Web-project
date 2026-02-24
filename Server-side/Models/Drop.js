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

    description: {
      type: String
    },

    bannerImage: {
      type: String
    },

    releaseDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date
    },

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
dropSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Drop", dropSchema);
