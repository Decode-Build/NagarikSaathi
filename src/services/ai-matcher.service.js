// Stub for external AI API call
const callLiveAIMatcher = async (citizenProfile) => {
  // In a real scenario, this would use axios/fetch to hit an LLM service
  // For now, we simulate a delay that sometimes exceeds the 3.5s timeout to test the fallback
  return new Promise((resolve, reject) => {
    const delay = Math.random() > 0.5 ? 2000 : 4000;
    setTimeout(() => {
      // Return some mocked scheme IDs
      resolve(['SCHEME-001', 'SCHEME-002']);
    }, delay);
  });
};

module.exports = { callLiveAIMatcher };
