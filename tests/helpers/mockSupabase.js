function mockChain(resolvedValue) {
  const chain = {};
  const methods = ["select", "insert", "update", "delete", "eq", "limit", "order"];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve) => resolve(resolvedValue);
  chain.catch = jest.fn(() => chain);
  return chain;
}

function setupMockSupabase() {
  const mockFrom = jest.fn();
  jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));
  return mockFrom;
}

module.exports = { mockChain, setupMockSupabase };
