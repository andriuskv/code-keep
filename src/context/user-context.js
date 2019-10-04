import React, { useState, useContext, useEffect } from "react";
import { fetchUser, createUser, loginUser, logoutUser } from "../services/userService";

const UserContext = React.createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState({ loading: true });

  useEffect(() => {
    getLoggedUser();
  }, []);

  async function getLoggedUser() {
    try {
      const user = await fetchUser("me");

      if (user.code) {
        setUser({});
      }
      else {
        setUser(user);
      }
    } catch (e) {
      console.log(e);
      setUser({});
    }
  }

  async function registerUser(user) {
    const data = await createUser(user);

    if (data.username) {
      setUser(data);
    }
    return data;
  }

  async function signInUser(user) {
    const data = await loginUser(user);

    if (data.username) {
      setUser(data);
    }
    return data;
  }

  async function signOutUser() {
    const data = await logoutUser();

    if (data.code === 200) {
      setUser({ status: "logged-out" });
      return true;
    }
    return false;
  }

  return <UserContext.Provider value={{ ...user, registerUser, signInUser, signOutUser }}>{ children }</UserContext.Provider>;
}

function useUser() {
  return useContext(UserContext);
}

export {
  UserProvider,
  useUser
};
