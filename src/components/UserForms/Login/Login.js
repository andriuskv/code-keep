import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import img from "../../../assets/header-image.png";
import spinner from "../../../assets/ring.svg";

export default function Login() {
  const [fieldMessage, setFieldMessage] = useState({});
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const { signInUser } = useUser();
  const history = useHistory();
  const location = useLocation();

  function hideFieldMessage(name) {
    delete fieldMessage[name];
    setFieldMessage({ ...fieldMessage });
  }

  async function handleSignIn(event) {
    const { elements } = event.target;
    const { username: {value: username }, password: {value: password }} = elements;
    event.preventDefault();

    try {
      setFieldMessage({});
      setSubmitButtonState(true);
      const data = await signInUser({ username, password });
      setSubmitButtonState(false);

      if (data.code === 400) {
        setFieldMessage({ form: "Incorrect username or password." });
      }
      else if (data.code === 500) {
        setFieldMessage({ form: "Something went wrong. Try again later." });
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
      setFieldMessage({ form: "Something went wrong. Try again later." });
    }
  }

  return (
    <form onSubmit={handleSignIn} className="user-form">
      <img src={img} className="user-form-image" width="344px" height="98px" alt="" />
      <h2 className="user-form-title">Sign In</h2>
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
        <input type="text" className="input user-form-field" name="username" required />
      </label>
      <label className="user-form-field-group">
        <div className="user-form-field-name">Password</div>
        <input type="password" className="input user-form-field" name="password" required />
      </label>
      <button className="btn user-form-submit-btn" disabled={submitButtonState}>
        <span>Sign In</span>
        {submitButtonState && (
          <img src={spinner} className="user-form-submit-btn-spinner" alt="" />
        )}
      </button>
      <div className="user-form-bottom">
        Not an user?<Link to="/register" className="user-form-bottom-link">Create an account</Link>.
      </div>
    </form>
  );
}
