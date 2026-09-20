/** In-memory AsyncStorage for Jest (RN native module is null in Node). */
const store = new Map();

const AsyncStorage = {
  setItem: jest.fn(async (key, value) => {
    store.set(key, String(value));
  }),
  getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
  removeItem: jest.fn(async key => {
    store.delete(key);
  }),
  multiGet: jest.fn(async keys => keys.map(key => [key, store.has(key) ? store.get(key) : null])),
  multiSet: jest.fn(async pairs => {
    for (const [key, value] of pairs) {
      store.set(key, String(value));
    }
  }),
  multiRemove: jest.fn(async keys => {
    for (const key of keys) {
      store.delete(key);
    }
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => [...store.keys()]),
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
module.exports.__esModule = true;
