import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useUser } from "../../../context/user-context";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";
import img from "../../../assets/header-image.png";

export default function Login() {
  const [notification, setNotification] = useState("");
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const { signInUser } = useUser();
  const history = useHistory();
  const location = useLocation();

  function hideNotification() {
    setNotification("");
  }

  async function handleSignIn(event) {
    const { elements } = event.target;
    const { username: { value: username }, password: { value: password }} = elements;
    event.preventDefault();

    try {
      hideNotification();
      setSubmitButtonState(true);
      const data = await signInUser({ username, password });
      setSubmitButtonState(false);

      if (data.code === 400) {
        setNotification("Incorrect username or password.");
      }
      else if (data.code === 500) {
        setNotification("Something went wrong. Try again later.");
      }
      else if (location.search.startsWith("?redirect=")) {
        history.replace({
          pathname: location.search.split("=")[1]
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
      setNotification("Something went wrong. Try again later.");
    }
  }

  return (
    <form onSubmit={handleSignIn} className="user-form">
      <img src={img} className="user-form-image" width="344px" height="98px" alt="" />
      <h2 className="user-form-title">Sign In</h2>
      {notification && (
        <Notification className="user-form-notification"
          value={notification} dismiss={hideNotification}/>
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
