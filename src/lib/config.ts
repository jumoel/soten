// Implement functions to read and write configuration values from localstorage.

export const getConfigValue = async (key: string, defaultValue: string) => {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value;
};
