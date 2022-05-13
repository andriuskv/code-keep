import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./user-forms.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import Login from "./Login";
import Register from "./Register";

export default function UserForms() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState("");
  const { usernameLowerCase, loading } = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, location.pathname]);

  function init() {
    if (loading) {
      return;
    }

    if (location.pathname === "/login") {
      if (usernameLowerCase) {
        if (location.search.startsWith("?redirect=")) {
          redirectUser(location.search.split("?redirect=")[1]);
        }
        else {
          redirectUser(`/users/${usernameLowerCase}`);
        }
      }
      else {
        setState("login");
        setDocumentTitle("Sign in");
      }
    }
    else if (location.pathname === "/register") {
      if (usernameLowerCase) {
        redirectUser(`/users/${usernameLowerCase}`);
      }
      else {
        setState("register");
        setDocumentTitle("Sign up");
      }
    }
  }

  function redirectUser(path) {
    const [pathname, search] = path.split("?");

    navigate({
      pathname,
      search: search ? `?${search}` : ""
    }, { replace: true });
  }

  if (state === "register") {
    return <Register/>;
  }
  else if (state === "login") {
    return <Login/>;
  }
  return null;
}
