export function getStoredValue(key: string, defaultValue: string) {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value;
}

export function storeValue(key: string, value: string) {
  localStorage.setItem(key, value);
}
