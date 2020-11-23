import { useState } from "react";
import "./username-form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import { updateUser } from "../../../services/userService";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";

export default function UsernameForm() {
  const user = useUser();
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const [notification, setNotification] = useState(null);

  function hideNotification() {
    setNotification(null);
  }

  function handleKeydown() {
    if (notification) {
      hideNotification();
    }
  }

  async function handleFormSubmit(event) {
    const { username: { value: newUsername } } = event.target.elements;

    event.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(newUsername)) {
      setNotification({ value: "Username can only contain alphanumeric characters." });
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setNotification({ value: "Username length should be between 3 and 20 characters." });
      return;
    }

    if (newUsername === user.username) {
      setNotification({ value: "Cannot change to the same username." });
      return;
    }
    setSubmitButtonState(true);

    try {
      const data = await updateUser(user.username, {
        oldUsername: user.username,
        newUsername
      });

      if (data.code === 204) {
        user.updateUser({
          username: newUsername,
          usernameLowerCase: newUsername.toLowerCase()
        });
        setNotification({
          value: "Username has been changed successfully.",
          type: "positive"
        });
      } else if (data.code === 400 && data.message) {
        setNotification({ value: data.message });
      }
      else {
        setNotification({ value: GENERIC_ERROR_MESSAGE });
      }
      setSubmitButtonState(false);
    } catch (e) {
      console.log(e);
      setNotification({ value: GENERIC_ERROR_MESSAGE });
      setSubmitButtonState(false);
    }
  }

  return (
    <div className="settings-item">
      <h3 className="settings-item-title">Change Username</h3>
      {notification && (
        <Notification margin="bottom"
          notification={notification}
          dismiss={hideNotification}/>
      )}
      <form className="username-form" onSubmit={handleFormSubmit} onKeyDown={handleKeydown}>
        <label className="username-form-field-container">
          <div className="settings-form-field-title">Username</div>
          <input type="text" className="input settings-form-field"
            defaultValue={user.username} name="username" required/>
        </label>
        <button className="btn username-form-submit-btn"
          disabled={submitButtonState.username}>
          <span>Change</span>
          {submitButtonState.username && <ButtonSpinner/>}
        </button>
      </form>
    </div>
  );
}
