const fs = require('fs');
const path = require('path');
const { Scheme } = require('../models/Scheme');

const seedSchemes = async () => {
  try {
    const filePath = path.join(__dirname, 'schemes.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const schemes = JSON.parse(fileData);

    for (const schemeData of schemes) {
      await Scheme.findOneAndUpdate(
        { schemeId: schemeData.schemeId },
        schemeData,
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ Schemes seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
  }
};

module.exports = { seedSchemes };
