import React, { useState, useRef } from "react";
import { updateUserPassword } from "../../../services/userService";
import Icon from "../../Icon";
import img from "../../../assets/header-image.png";
import spinner from "../../../assets/ring.svg";

export default function ChangePassword() {
  const [fieldMessage, setFieldMessage] = useState({});
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const formElement = useRef(null);

  function hideFieldMessage(name) {
    delete fieldMessage[name];
    setFieldMessage({ ...fieldMessage });
  }

  function handleKeydown(event) {
    if (fieldMessage[event.target.name]) {
      hideFieldMessage(event.target.name);
    }
  }

  async function handleChangePassword(event) {
    const { elements } = event.target;
    const currentPassword = elements.currentPassword.value;
    const [{ value: newPassword }, { value: repeatedNewPassword }] = elements.newPassword;
    event.preventDefault();

    if (newPassword.length < 6 || repeatedNewPassword.length < 6) {
      setFieldMessage({ newPassword: "New password must be atleast 6 characters." });
      return;
    }
    else if (newPassword !== repeatedNewPassword) {
      setFieldMessage({ newPassword: "Passwords don't match." });
      return;
    }

    try {
      setFieldMessage({});
      setSubmitButtonState(true);
      const data = await updateUserPassword({
        currentPassword,
        newPassword,
        repeatedNewPassword
      });
      setSubmitButtonState(false);

      if (data.code === 200) {
        formElement.current.reset();
        setFieldMessage({
          form: {
            value: "Password has been changed.",
            type: "success"
          }
        });
      }
      else if (data.code === 400) {
        setFieldMessage({ [data.field]: data.message });
      }
      else {
        setFieldMessage({
          form: {
            value: "Something went wrong. Try again later.",
            type: "error"
          }
        });
      }
    } catch (e) {
      console.log(e);
      setSubmitButtonState(false);
      setFieldMessage({
        form: {
          value: "Something went wrong. Try again later.",
          type: "error"
        }
      });
    }
  }

  return (
    <form className="user-form" ref={formElement} onSubmit={handleChangePassword} onKeyDown={handleKeydown}>
      <img src={img} className="user-form-image" width="344px" height="98px" alt="" />
      <h2 className="user-form-title">Change Password</h2>
      {fieldMessage.form && (
        <div className={`user-form-message ${fieldMessage.form.type}`}>
          <span>{fieldMessage.form.value}</span>
          <button type="button" className="btn icon-btn user-form-message-btn"
            onClick={() => hideFieldMessage("form")}>
            <Icon name="close" />
          </button>
        </div>
      )}
      <label className="user-form-field-group">
        <div className="user-form-field-name">Current Password</div>
        <input type="password" className="input user-form-field"
          name="currentPassword" required />
      </label>
      {fieldMessage.currentPassword && (
        <div className="user-form-field-message">{fieldMessage.currentPassword}</div>
      )}
      <div className="user-form-field-groups">
        <label className="user-form-field-group">
          <div className="user-form-field-name">New Password</div>
          <input type="password" className="input user-form-field"
            name="newPassword" required />
        </label>
        <label className="user-form-field-group">
          <div className="user-form-field-name">Repeat New Password</div>
          <input type="password" className="input user-form-field"
            name="newPassword" required />
        </label>
      </div>
      {fieldMessage.newPassword && (
        <div className="user-form-field-message">{fieldMessage.newPassword}</div>
      )}
      <button className="btn user-form-submit-btn" disabled={submitButtonState}>
        <span>Change Password</span>
        {submitButtonState && (
          <img src={spinner} className="user-form-submit-btn-spinner" alt="" />
        )}
      </button>
    </form>
  );
}
