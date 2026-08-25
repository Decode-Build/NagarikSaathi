const { Scheme } = require('../models/Scheme');

const ruleMatch = async (citizenProfile) => {
  const schemes = await Scheme.find({});
  
  const matchedSchemes = schemes.filter(scheme => {
    const { minAge, maxAge, maxIncome, states, categories } = scheme.eligibilityRules || {};

    if (minAge !== undefined && minAge !== null && citizenProfile.age < minAge) return false;
    if (maxAge !== undefined && maxAge !== null && citizenProfile.age > maxAge) return false;
    if (maxIncome !== undefined && maxIncome !== null && citizenProfile.income > maxIncome) return false;
    
    if (states && states.length > 0 && !states.includes(citizenProfile.state)) return false;
    if (categories && categories.length > 0 && (!citizenProfile.category || !categories.includes(citizenProfile.category))) return false;

    return true;
  });

  return matchedSchemes.map(s => s.schemeId);
};

module.exports = { ruleMatch };
