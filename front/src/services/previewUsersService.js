const STORAGE_KEY = 'preview_users_v1';

function readUsers() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error('Failed to read preview users:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to write preview users:', error);
  }
}

export function getPreviewUsers() {
  return readUsers();
}

export function savePreviewUsers(users) {
  writeUsers(Array.isArray(users) ? users : []);
}
