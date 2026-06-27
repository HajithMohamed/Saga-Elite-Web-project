const mongoose = require("mongoose");
const connectDB = require("../DataBase/db");
const Testimonial = require("../Models/Testimonial");

// The content that was previously hardcoded on the homepage. Seeded so admins
// start with editable copies; the public component also keeps these as a
// runtime fallback when the collection is empty.
const DEFAULTS = [
  {
    name: "Nadeesha P.",
    handle: "@nadeesha.p",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 5,
    text: "The mystery gift in my last drop was a hand-numbered patch I've never seen anywhere else. This brand actually feels rare.",
    verified: true,
    displayOrder: 1,
  },
  {
    name: "Tharindu K.",
    handle: "@tharik.fits",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    text: "Cop. Wear. Get DMs about it. The fits sit different — and the drop hype is real.",
    verified: true,
    displayOrder: 2,
  },
  {
    name: "Sashini R.",
    handle: "@sash.r",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    rating: 5,
    text: "Premium feel without the import shipping headache. Got my piece in two days, in Galle. Boxed like a gift.",
    verified: true,
    displayOrder: 3,
  },
];

const seedTestimonials = async () => {
  const hadConnectionAlready = mongoose.connection.readyState === 1;
  try {
    if (!hadConnectionAlready) await connectDB();

    const count = await Testimonial.countDocuments();
    if (count > 0) {
      console.log(`Testimonials already present (${count}); skipping seed.`);
    } else {
      await Testimonial.insertMany(DEFAULTS);
      console.log(`Seeded ${DEFAULTS.length} default testimonials.`);
    }

    if (!hadConnectionAlready) await mongoose.connection.close();
  } catch (error) {
    if (!hadConnectionAlready) {
      await mongoose.connection.close().catch(() => {});
    }
    throw error;
  }
};

if (require.main === module) {
  seedTestimonials().catch(async (error) => {
    console.error("Failed to seed testimonials", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close().catch(() => {});
    }
    process.exitCode = 1;
  });
}

module.exports = seedTestimonials;
