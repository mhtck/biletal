const TOKEN_KEY = "refresh";
const ACCESS_KEY = "access";

export const tokenHandler = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error("getToken:", error);
      return null;
    }
  },

  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("setToken:", error);
    }
  },
  getAccess: () => {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch (error) {
      console.error("access:", error);
      return null;
    }
  },

  setAccess: (token) => {
    try {
      localStorage.setItem(ACCESS_KEY, token);
    } catch (error) {
      console.error("setAccess:", error);
    }
  },
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("removeToken:", error);
    }
  },

  hasToken: () => {
    return !!tokenHandler.getToken();
  },

  decodeToken: (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      console.log("User : " , JSON.parse(jsonPayload))
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("decodeToken:", error);
      return null;
    }
  },

  isTokenExpired: (token) => {
    try {
      const decoded = tokenHandler.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("isTokenExpired:", error);
      return true;
    }
  },

  getUserFromToken: (token) => {
    try {
      const decoded = tokenHandler.decodeToken(token);
      return decoded?.user || null;
    } catch (error) {
      console.error("getUserFromToken:", error);
      return null;
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("auth") ||
            key.includes("token") ||
            key.includes("user") ||
            key.includes("persist"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("clearAll:", error);
    }
  },
};
