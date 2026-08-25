const EligibilityQuery = require('../models/EligibilityQuery');

const getHistory = async (req, res) => {
  const citizenId = req.user.id;

  try {
    const history = await EligibilityQuery.find({ citizenId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: history });
  } catch (err) {
    console.error('Error fetching citizen history:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch history' });
  }
};

module.exports = { getHistory };
