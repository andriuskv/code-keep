import React, { useState } from "react";
import "./account-delete-form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import { deleteUser } from "../../../services/userService";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";

export default function AccountDeleteForm() {
  const { setUserStatus } = useUser();
  const [notification, setNotification] = useState("");
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const [inputValid, setInputValid] = useState(false);

  function hideNotification() {
    setNotification("");
  }

  function handleKeydown(event) {
    if (event.key === "Enter" && event.target.nodeName === "INPUT") {
      event.preventDefault();
    }
  }

  function handleInput(event) {
    const { name, value } = event.target;

    if (name === "verification" && value === "delete" && !inputValid) {
      setInputValid(true);
    }
    else if (inputValid) {
      setInputValid(false);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    if (event.target.elements.verification.value !== "delete") {
      return;
    }
    try {
      setSubmitButtonState(true);
      const status = await deleteUser();

      if (status.code === 200) {
        setUserStatus("deleted");
      }
      else {
        setNotification(GENERIC_ERROR_MESSAGE);
        setSubmitButtonState(false);
      }
    } catch (e) {
      console.log(e);
      setNotification(GENERIC_ERROR_MESSAGE);
      setSubmitButtonState(false);
    }
  }

  return (
    <div className="settings-item">
      <h3 className="account-delete-form-title">Delete Account</h3>
      {notification && (
        <Notification className="settings-form-notification"
          value={notification} dismiss={hideNotification}/>
      )}
      <form onSubmit={handleFormSubmit} onKeyDown={handleKeydown} onInput={handleInput}>
        <p className="account-delete-form-notice">Deleting your account will delete <b>all</b> except your local snippets, also your username will become available to anyone.</p>
        <div className="account-delete-form-group">
          <label className="account-delete-form-field-container">
            <div className="settings-form-field-title">For verification, type: <i className="account-delete-form-keyword">delete</i></div>
            <input type="text" className="input settings-form-field" name="verification" required/>
          </label>
          <button className="btn account-delete-form-submit-btn"
            disabled={!inputValid || submitButtonState}>
            <span>Delete Your Account</span>
            {submitButtonState && <ButtonSpinner/>}
          </button>
        </div>
      </form>
    </div>
  );
}
