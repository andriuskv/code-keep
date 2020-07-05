import React, { useState, useRef } from "react";
import "./password-form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import { updateUser } from "../../../services/userService";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";

export default function PasswordForm() {
  const { username } = useUser();
  const formElement = useRef(null);
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const [notification, setNotification] = useState({});

  function showNotification(field, { value, type = "negative" }) {
    setNotification({ [field]: { value, type } });
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
      showNotification("newPassword", { value: "New password must be at least 6 characters." });
      return;
    }
    else if (newPassword !== repeatedNewPassword) {
      showNotification("newPassword", { value: "Passwords don't match." });
      return;
    }
    else if (currentPassword === newPassword) {
      showNotification("newPassword", { value: "New and old passwords cannot be the same." });
      return;
    }

    try {
      setSubmitButtonState(true);
      const data = await updateUser(username, {
        currentPassword,
        newPassword,
        repeatedNewPassword
      });

      if (data.code === 204) {
        formElement.current.reset();
        showNotification("form", {
          value: "Password has been changed successfully.",
          type: "positive"
        });
      }
      else if (data.code === 400) {
        showNotification([data.field], { value: data.message });
      }
      else {
        showNotification("form", { value: GENERIC_ERROR_MESSAGE });
      }
      setSubmitButtonState(false);
    } catch (e) {
      console.log(e);
      showNotification("form", { value: GENERIC_ERROR_MESSAGE });
      setSubmitButtonState(false);
    }
  }

  return (
    <div className="settings-item">
      <h3 className="settings-item-title">Change Password</h3>
      {notification.form && (
        <Notification margin="bottom"
          notification={notification.form}
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
