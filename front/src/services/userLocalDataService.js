const STORAGE_KEY = 'user_management_local_data_v1';

function readStore() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch (error) {
    console.error('Failed to read local user data:', error);
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to write local user data:', error);
  }
}

export function getLocalUserData(userId) {
  if (userId === null || userId === undefined) {
    return {};
  }

  const store = readStore();
  return store[String(userId)] || {};
}

export function mergeLocalUserData(userId, nextData) {
  if (userId === null || userId === undefined || !nextData || typeof nextData !== 'object') {
    return {};
  }

  const key = String(userId);
  const store = readStore();
  const previousData = store[key] || {};

  store[key] = {
    ...previousData,
    ...nextData,
  };

  writeStore(store);
  return store[key];
}
