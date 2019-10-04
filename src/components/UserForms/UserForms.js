import React, { useState, useEffect } from "react";
import "./user-forms.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import Login from "./Login";
import Register from "./Register";
import ChangePassword from "./ChangePassword";

export default function UserForms(props) {
  const [state, setState] = useState("");
  const { username, loading } = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function init() {
    if (loading) {
      return;
    }

    if (props.match.path === "/login") {
      if(username) {
        redirectUser(`/users/${username}`);
      }
      else {
        setState("login");
        setDocumentTitle("Sign in");
      }
    }
    else if (props.match.path === "/register") {
      if(username) {
        redirectUser(`/users/${username}`);
      }
      else {
        setState("register");
        setDocumentTitle("Sign up");
      }
    }
    else if (props.match.path === "/change/password") {
      if (username) {
        setState("change-password");
        setDocumentTitle("Change password");
      }
      else {
        redirectUser("/login");
      }
    }
  }

  function redirectUser(path) {
    props.history.replace({
      pathname: path
    });
  }

  if (state === "register") {
    return <Register />;
  }
  else if (state === "login") {
    return <Login />;
  }
  else if (state === "change-password") {
    return <ChangePassword />;
  }
  return null;
}
