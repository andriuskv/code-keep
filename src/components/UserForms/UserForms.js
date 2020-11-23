import { useState, useEffect } from "react";
import "./user-forms.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import Login from "./Login";
import Register from "./Register";

export default function UserForms(props) {
  const [state, setState] = useState("");
  const { usernameLowerCase, loading } = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function init() {
    if (loading) {
      return;
    }

    if (props.match.path === "/login") {
      if(usernameLowerCase) {
        if (props.location.search.startsWith("?redirect=")) {
          redirectUser(props.location.search.split("?redirect=")[1]);
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
    else if (props.match.path === "/register") {
      if(usernameLowerCase) {
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

    props.history.replace({
      pathname,
      search: search ? `?${search}` : ""
    });
  }

  if (state === "register") {
    return <Register />;
  }
  else if (state === "login") {
    return <Login />;
  }
  return null;
}
