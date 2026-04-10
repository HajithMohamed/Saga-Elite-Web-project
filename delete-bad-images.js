require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const Image = require('./Server-side/Models/Image');

async function deleteBadImages() {
  try {
    const mongoUri = process.env.MONGO_DB_URI + 'sagaelite';
    console.log('Connecting to:', mongoUri.replace(/\/\/.*@/, '//<credentials>@'));
    await mongoose.connect(mongoUri);
    const imageIds = [
      '69a94866ff55db6f03029f65',
      '69a94867ff55db6f03029f67',
      '69a94867ff55db6f03029f69',
      '69a94867ff55db6f03029f6b'
    ];
    await Image.updateMany({ _id: { $in: imageIds } }, { isDeleted: true });
    console.log('Images marked as deleted');
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

deleteBadImages();