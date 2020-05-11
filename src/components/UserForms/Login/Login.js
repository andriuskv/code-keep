import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";
import logo from "../../../assets/logo.svg";

export default function Login() {
  const [notification, setNotification] = useState(null);
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const { signInUser } = useUser();
  const history = useHistory();
  const location = useLocation();

  function hideNotification() {
    setNotification(null);
  }

  async function handleSignIn(event) {
    const { elements } = event.target;
    const { username: { value: username }, password: { value: password }} = elements;
    event.preventDefault();

    try {
      setSubmitButtonState(true);
      const data = await signInUser({ username, password });
      setSubmitButtonState(false);

      if (data.code === 400) {
        setNotification({ value: "Incorrect username or password." });
      }
      else if (data.code === 429) {
        setNotification({ value: data.message });
      }
      else if (data.code === 500) {
        setNotification({ value: GENERIC_ERROR_MESSAGE });
      }
      else if (location.search.startsWith("?redirect=")) {
        const [pathname, search] = location.search.split("?redirect=")[1].split("?");

        history.replace({
          pathname,
          search: search ? `?${search}` : ""
        });
      }
      else {
        history.replace({
          pathname: `/users/${data.usernameLowerCase}`
        });
      }
    } catch (e) {
      console.log(e);
      setSubmitButtonState(false);
      setNotification({ value: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <form onSubmit={handleSignIn} className="container user-form">
      <img src={logo} className="user-form-image" height="64px" alt="" />
      <h2 className="user-form-title">Sign In</h2>
      {notification && (
        <Notification margin="top"
          notification={notification}
          dismiss={hideNotification}/>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Username</div>
        <input type="text" className="input user-form-field" name="username" required />
      </label>
      <label className="user-form-field-group">
        <div className="user-form-field-name">Password</div>
        <input type="password" className="input user-form-field" name="password" required />
      </label>
      <button className="btn user-form-submit-btn" disabled={submitButtonState}>
        <span>Sign In</span>
        {submitButtonState && <ButtonSpinner/>}
      </button>
      <div className="user-form-bottom">
        Not an user?<Link to="/register" className="user-form-bottom-link">Create an account</Link>.
      </div>
    </form>
  );
}
