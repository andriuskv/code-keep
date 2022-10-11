import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { fetchUser, createUser, loginUser, logoutUser } from "../services/userService";

const UserContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState({ loading: true });
  const memoizedValue = useMemo(() => {
    return {
      ...user,
      registerUser,
      signInUser,
      signOutUser,
      resetUser,
      updateUser,
      setUserStatus
    };
  }, [user]);

  useEffect(() => {
    getLoggedUser();
  }, []);

  async function getLoggedUser() {
    try {
      const user = await fetchUser("me");

      if (user.code === 204) {
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
    const status = await logoutUser();

    if (status === 204) {
      setUserStatus("logged-out");
      return true;
    }
    return false;
  }

  function setUserStatus(status) {
    setUser({ status });
  }

  function resetUser() {
    setUser({});
  }

  function updateUser(data) {
    setUser({ ...user, ...data });
  }

  return <UserContext.Provider value={memoizedValue}>{ children }</UserContext.Provider>;
}

function useUser() {
  return useContext(UserContext);
}

export {
  UserProvider,
  useUser
};
