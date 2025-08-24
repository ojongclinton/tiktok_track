import { createSlice } from "@reduxjs/toolkit";
import secureLocalStorage from "react-secure-storage";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    user: secureLocalStorage.getItem("user") || null,
    jwtToken: secureLocalStorage.getItem("jwtToken") || null,
  },
  reducers: {
    setNewJwt: (state, action) => {
      state.jwtToken = action.payload.jwtToken;
    },
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.jwtToken = action.payload.jwtToken;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.jwtToken = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const { login, logout,setNewJwt } = authSlice.actions;

export default authSlice.reducer;
