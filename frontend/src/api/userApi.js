// centralizes auth calls (uses your global axios defaults)
import axios from "axios";

export const loginUserApi = (identifier, password) =>
  axios.post("/api/users/login", { identifier, password }, { withCredentials: true });

export const registerUserApi = ({ fullName, username, email, password }) =>
  axios.post("/api/users/register", { fullName, username, email, password }, { withCredentials: true });

export const getMeApi = () =>
  axios.get("/api/users/me", { withCredentials: true });

export const logoutUserApi = () =>
  axios.post("/api/users/logout", {}, { withCredentials: true });
