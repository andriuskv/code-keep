import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import img from "../../../assets/header-image.png";
import spinner from "../../../assets/ring.svg";

export default function Register() {
  const [fieldMessage, setFieldMessage] = useState({});
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const { registerUser } = useUser();
  const history = useHistory();

  function hideFieldMessage(name) {
    delete fieldMessage[name];
    setFieldMessage({ ...fieldMessage });
  }

  function handleKeydown(event) {
    if (fieldMessage[event.target.name]) {
      hideFieldMessage(event.target.name);
    }
  }

  async function handleSignUp(event) {
    const { elements } = event.target;
    const { username: {value: username }, email: {value: email }} = elements;
    const [{ value: password }, { value: repeatedPassword }] = elements.password;
    event.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setFieldMessage({ username: "Username can only contain alphanumeric characters." });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setFieldMessage({ username: "Username length shuold be between 3 and 20 characters." });
      return;
    }

    if (email.length < 6 || email.length > 320) {
      setFieldMessage({ email: "Invalid email." });
      return;
    }

    if (password.length < 6 || repeatedPassword.length < 6) {
      setFieldMessage({ password: "Password must be atleast 6 characters." });
      return;
    }

    if (password !== repeatedPassword) {
      setFieldMessage({ password: "Passwords don't match." });
      return;
    }

    try {
      setFieldMessage({});
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
        setFieldMessage({ [data.field]: data.message });
      }
      else {
        setFieldMessage({ form: "Something went wrong. Try again later." });
      }
    } catch (e) {
      console.log(e);
      setSubmitButtonState(false);
      setFieldMessage({ form: "Something went wrong. Try again later." });
    }
  }

  return (
    <form className="user-form" onSubmit={handleSignUp} onKeyDown={handleKeydown}>
      <img src={img} className="user-form-image" width="344px" height="98px" alt="" />
      <h2 className="user-form-title">Sign Up</h2>
      {fieldMessage.form && (
        <div className="user-form-message error">
          <span>{fieldMessage.form}</span>
          <button type="button" className="btn icon-btn user-form-message-btn"
            onClick={() => hideFieldMessage("form")}>
            <Icon name="close" />
          </button>
        </div>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Username</div>
        <input type="text" className="input user-form-field"
          name="username" required />
      </label>
      {fieldMessage.username && (
        <div className="user-form-field-message">{fieldMessage.username}</div>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Email</div>
        <input type="email" className="input user-form-field"
          name="email" required />
      </label>
      {fieldMessage.email && (
        <div className="user-form-field-message">{fieldMessage.email}</div>
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
      {fieldMessage.password && (
        <div className="user-form-field-message">{fieldMessage.password}</div>
      )}
      <button className="btn user-form-submit-btn" disabled={submitButtonState}>
        <span>Sign Up</span>
        {submitButtonState && (
          <img src={spinner} className="user-form-submit-btn-spinner" alt="" />
        )}
      </button>
      <div className="user-form-bottom">
        Already an user?<Link to="/login" className="user-form-bottom-link">Sign in</Link>.
      </div>
    </form>
  );
}
