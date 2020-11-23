import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";
import logo from "../../../assets/logo.svg";

export default function Register() {
  const [notification, setNotification] = useState({});
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const { registerUser } = useUser();
  const history = useHistory();

  function hideNotification(name) {
    delete notification[name];
    setNotification({ ...notification });
  }

  function showNotification(field, message) {
    setNotification({ [field]: { value: message }});
  }

  function handleKeydown(event) {
    if (notification[event.target.name]) {
      hideNotification(event.target.name);
    }
  }

  async function handleSignUp(event) {
    const { elements } = event.target;
    const { username: {value: username }, email: {value: email }} = elements;
    const [{ value: password }, { value: repeatedPassword }] = elements.password;
    event.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      showNotification("username", "Username can only contain alphanumeric characters.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      showNotification("username", "Username length should be between 3 and 20 characters.");
      return;
    }

    if (email.length < 6 || email.length > 320) {
      showNotification("email", "Invalid email.");
      return;
    }

    if (password.length < 6 || repeatedPassword.length < 6) {
      showNotification("password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== repeatedPassword) {
      showNotification("password", "Passwords don't match.");
      return;
    }

    try {
      setSubmitButtonState(true);
      const data = await registerUser({
        username,
        email,
        password,
        repeatedPassword
      });
      setSubmitButtonState(false);

      if (data.username) {
        history.push({
          pathname: `/users/${data.username}`
        });
      }
      else if (data.code === 400) {
        showNotification(data.field, data.message || GENERIC_ERROR_MESSAGE);
      }
      else {
        showNotification("form", GENERIC_ERROR_MESSAGE);
      }
    } catch (e) {
      console.log(e);
      setSubmitButtonState(false);
      showNotification("form", GENERIC_ERROR_MESSAGE);
    }
  }

  return (
    <form className="container user-form" onSubmit={handleSignUp} onKeyDown={handleKeydown}>
      <img src={logo} className="user-form-image" height="64px" alt="" />
      <h2 className="user-form-title">Sign Up</h2>
      {notification.form && (
        <Notification margin="top"
          notification={notification.form}
          dismiss={() => hideNotification("form")}/>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Username</div>
        <input type="text" className="input user-form-field"
          name="username" required />
      </label>
      {notification.username && (
        <div className="user-form-field-notification">{notification.username.value}</div>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Email</div>
        <input type="email" className="input user-form-field"
          name="email" required />
      </label>
      {notification.email && (
        <div className="user-form-field-notification">{notification.email.value}</div>
      )}
      <div className="user-form-field-groups">
        <label className="user-form-field-group">
          <div className="user-form-field-name">Password</div>
          <input type="password" className="input user-form-field"
            name="password" required />
        </label>
        <label className="user-form-field-group">
          <div className="user-form-field-name">Repeat Password</div>
          <input type="password" className="input user-form-field"
            name="password" required />
        </label>
      </div>
      {notification.password && (
        <div className="user-form-field-notification">{notification.password.value}</div>
      )}
      <button className="btn user-form-submit-btn" disabled={submitButtonState}>
        <span>Sign Up</span>
        {submitButtonState && <ButtonSpinner/>}
      </button>
      <div className="user-form-bottom">
        Already an user?<Link to="/login" className="user-form-bottom-link">Sign in</Link>.
      </div>
    </form>
  );
}
