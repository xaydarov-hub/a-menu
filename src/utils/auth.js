export const getStoredUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};