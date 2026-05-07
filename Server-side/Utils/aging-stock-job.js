const cron = require('node-cron');
const Product = require('../Models/Product');
const Offer = require('../Models/Offer');

const checkAgingStock = async () => {
  try {
    console.log('Running aging stock detection job...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find products created > 90 days ago (or lastSoldAt > 90 days ago) that are active
    const agingProducts = await Product.find({
      isActive: true,
      $or: [
        { lastSoldAt: { $lte: ninetyDaysAgo } },
        { lastSoldAt: null, createdAt: { $lte: ninetyDaysAgo } }
      ]
    });

    if (agingProducts.length === 0) {
      console.log('No aging products found.');
      return;
    }

    // Filter products that have stock > 0
    const productsWithStock = agingProducts.filter(p => {
      if (!p.variants) return false;
      return p.variants.some(v => v.stock > 0);
    });

    if (productsWithStock.length === 0) {
      console.log('No aging products with stock found.');
      return;
    }

    // Upsert a system generated clearance offer
    let clearanceOffer = await Offer.findOne({ type: 'clearance', isSystemGenerated: true });
    
    if (!clearanceOffer) {
      clearanceOffer = new Offer({
        name: 'Auto-Clearance Sale',
        description: 'System generated clearance for aging stock.',
        type: 'clearance',
        discountPercent: 15,
        isSystemGenerated: true,
        isActive: true,
        products: []
      });
    }

    const productIdsToAdd = productsWithStock.map(p => p._id.toString());
    const existingOfferProductIds = clearanceOffer.products.map(id => id.toString());

    // Add unique
    productIdsToAdd.forEach(id => {
      if (!existingOfferProductIds.includes(id)) {
        clearanceOffer.products.push(id);
      }
    });

    await clearanceOffer.save();
    console.log(`Aging stock job completed. ${productIdsToAdd.length} products in clearance offer.`);
  } catch (error) {
    console.error('Error in checkAgingStock:', error);
  }
};

const initAgingStockJob = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', checkAgingStock);
};

module.exports = { initAgingStockJob, checkAgingStock };
