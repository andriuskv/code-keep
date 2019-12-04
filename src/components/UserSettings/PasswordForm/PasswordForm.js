import React, { useState, useRef } from "react";
import "./password-form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { updateUserPassword } from "../../../services/userService";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";

export default function PasswordForm() {
  const formElement = useRef(null);
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const [notification, setNotification] = useState({});

  function setMessage(formName, { value, type = "negative" }) {
    setNotification({ [formName]: { value, type } });
  }

  function hideNotification(name) {
    delete notification[name];
    setNotification({ ...notification });
  }

  function handleKeydown({ target }) {
    if (notification[target.name]) {
      hideNotification(target.name);
    }

    if (notification.form) {
      hideNotification("form");
    }
  }

  async function handleFormSubmit(event) {
    const { elements } = event.target;
    const currentPassword = elements.currentPassword.value;
    const [{ value: newPassword }, { value: repeatedNewPassword }] = elements.newPassword;

    event.preventDefault();

    if (newPassword.length < 6 || repeatedNewPassword.length < 6) {
      setMessage("newPassword", { value: "New password must be atleast 6 characters." });
      return;
    }
    else if (newPassword !== repeatedNewPassword) {
      setMessage("newPassword", { value: "Passwords don't match." });
      return;
    }

    try {
      if (notification.form) {
        hideNotification("form");
      }
      setSubmitButtonState(true);
      const data = await updateUserPassword({
        currentPassword,
        newPassword,
        repeatedNewPassword
      });

      if (data.code === 200) {
        formElement.current.reset();
        setMessage("form", {
          value: "Password has been changed successfully.",
          type: "positive"
        });
      }
      else if (data.code === 400) {
        setMessage([data.field], { value: data.message });
      }
      else {
        setMessage("form", { value: GENERIC_ERROR_MESSAGE });
      }
      setSubmitButtonState(false);
    } catch (e) {
      console.log(e);
      setMessage("form", { value: GENERIC_ERROR_MESSAGE });
      setSubmitButtonState(false);
    }
  }

  return (
    <div className="settings-item">
      <h3 className="settings-item-title">Change Password</h3>
      {notification.form && (
        <Notification className="settings-form-notification"
          value={notification.form.value} type={notification.form.type}
          dismiss={() => hideNotification("form")}/>
      )}
      <form ref={formElement} onSubmit={handleFormSubmit} onKeyDown={handleKeydown}>
        <label className="password-form-field-container">
          <div className="settings-form-field-title">Current Password</div>
          <input type="password" className="input settings-form-field"
            name="currentPassword" required />
        </label>
        {notification.currentPassword && (
          <div className="password-form-field-notification">{notification.currentPassword.value}</div>
        )}
        <div className="password-form-field-group">
          <label className="password-form-field-container">
            <div className="settings-form-field-title">New Password</div>
            <input type="password" className="input settings-form-field"
              name="newPassword" required />
          </label>
          <label className="password-form-field-container">
            <div className="settings-form-field-title">Repeat New Password</div>
            <input type="password" className="input settings-form-field"
              name="newPassword" required />
          </label>
        </div>
        {notification.newPassword && (
          <div className="password-form-field-notification">{notification.newPassword.value}</div>
        )}
        <button className="btn password-form-submit-btn"
          disabled={submitButtonState}>
          <span>Change Password</span>
          {submitButtonState && <ButtonSpinner/>}
        </button>
      </form>
    </div>
  );
}
