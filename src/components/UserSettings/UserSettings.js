import React, { useState, useEffect, useRef } from "react";
import "./user-settings.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import { updateUser, updateUserPassword, uploadProfileImage } from "../../services/userService";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import spinner from "../../assets/ring.svg";

export default function UserSettings(props) {
  const [message, setFormMessage] = useState({});
  const [submitButtonState, setSubmitButtonState] = useState({});
  const [image, setImage] = useState(null);
  const user = useUser();
  const passwordFormElement = useRef(null);

  useEffect(() => {
    if (user.status === "logged-out") {
      user.updateUserStatus();
      return;
    }
    else if (!user.loading && !user.username) {
      props.history.replace({
        pathname: "/login",
        search: `?redirect=${props.match.url}`
      });
    }
    else {
      setDocumentTitle("Settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function setMessage(formName, { value, type = "error" }) {
    setFormMessage({ ...message, [formName]: { value, type } });
  }

  function hideMessage(name) {
    delete message[name];
    setFormMessage({ ...message });
  }

  function setButtonState(formName, state) {
    setSubmitButtonState({ ...submitButtonState, [formName]: state });
  }

  function handleKeydown({ target }) {
    if (message[target.name]) {
      hideMessage(target.name);
    }
  }

  async function resizeImage(file) {
    const { default: Jimp } = await import("jimp/es");
    const reader = new FileReader();

    reader.onload = async function(event) {
      try {
        const image = await Jimp.read(event.target.result);

        image.resize(Jimp.AUTO, 64);
        setImage({
          name: file.name,
          blob: new Blob([await image.getBufferAsync(file.type)], { type: file.type })
        });
      } catch (e) {
        console.log(e);
        setMessage("file", { value: e.message ? e.message : e });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileUpload({ target }) {
    const [file] = target.files;

    if (file.type.startsWith("image")) {
      if (file.size > 32768) {
        resizeImage(file);
      }
      else {
        setImage({
          name: file.name,
          blob: file
        });
      }

      if (message.file) {
        hideMessage("file");
      }
    }
    else {
      setMessage("file", { value: "Selected file is not an image." });
    }
    target.value = "";
  }

  async function handleFileFormSubmit(event) {
    const formData = new FormData();

    event.preventDefault();
    formData.append("profile_image", image.blob, image.name);
    setButtonState("file", true);

    try {
      const data = await uploadProfileImage(formData);

      if (data.username) {
        user.updateUser({
          profileImage: data.profileImage
        });
        setMessage("file", {
          value: "Profile image has been changed successfully.",
          type: "success"
        });
      }
      else if (data.code >= 400) {
        setMessage("file", { value: data.message || "Something went wrong. Try again later." });
      }
      setButtonState("file", false);
    } catch (e) {
      console.log(e);
      setMessage("file", { value: "Something went wrong. Try again later." });
      setButtonState("file", false);
    }
  }

  function showFileSelection(event) {
    if (event.key === "Enter" || event.key === " ") {
      document.getElementById("settings-file-form-input").click();
    }
  }

  async function handleUsernameChange(event) {
    const { username: {value: username } } = event.target.elements;
    event.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setMessage("username", { value: "Username can only contain alphanumeric characters." });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setMessage("username", { value: "Username length shuold be between 3 and 20 characters." });
      return;
    }

    if (username === user.username) {
      setMessage("username", { value: "Cannot change to the same username." });
      return;
    }
    setButtonState("username", true);

    try {
      const data = await updateUser({
        oldUsername: user.username,
        newUsername: username
      });

      if (data.code === 200) {
        user.updateUser({
          username,
          usernameLowerCase: username.toLowerCase()
        });
        setMessage("username", {
          value: "Username has been changed successfully.",
          type: "success"
        });
      } else if (data.code === 400 && data.message) {
        setMessage("username", { value: data.message });
      }
      else {
        setMessage("username", { value: "Something went wrong. Try again later." });
      }
      setButtonState("username", false);
    } catch (e) {
      console.log(e);
      setMessage("username", { value: "Something went wrong. Try again later." });
      setButtonState("username", false);
    }
  }

  function handlePasswordFormKeydown({ target }) {
    if (message[target.name]) {
      hideMessage(target.name);
    }

    if (message.passwordForm) {
      hideMessage("passwordForm");
    }
  }

  async function handleChangePassword(event) {
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
      if (message.passwordForm) {
        hideMessage("passwordForm");
      }
      setButtonState("passwordForm", true);
      const data = await updateUserPassword({
        currentPassword,
        newPassword,
        repeatedNewPassword
      });

      if (data.code === 200) {
        passwordFormElement.current.reset();
        setMessage("passwordForm", {
          value: "Password has been changed successfully.",
          type: "success"
        });
      }
      else if (data.code === 400) {
        setMessage([data.field], { value: data.message });
      }
      else {
        setMessage("passwordForm", { value: "Something went wrong. Try again later." });
      }
      setButtonState("passwordForm", false);
    } catch (e) {
      console.log(e);
      setMessage("passwordForm", { value: "Something went wrong. Try again later." });
      setButtonState("passwordForm", false);
    }
  }

  if (user.loading) {
    return <PageSpinner/>;
  }
  return (
    <div className="settings">
      <h2 className="settings-title">Settings</h2>
      <form className="settings-form" onSubmit={handleFileFormSubmit}>
        <h3 className="settings-form-title">Change Profile Image</h3>
        <div className="settings-form-group">
          {image ? (
            <div className="settings-file-form-preview-container">
              <img src={URL.createObjectURL(image.blob)} className="settings-file-form-preview" alt="" />
            </div>
          ) : user.profileImage ? (
            <div className="settings-file-form-preview-container">
              <img src={user.profileImage} className="settings-file-form-preview" alt="" />
            </div>
          ) : <Icon name="user" className="settings-file-form-default-preview" />}
          <label className="btn settings-file-form-input-btn" tabIndex="0" onKeyDown={showFileSelection}>
            <span>Select an image</span>
            <input type="file" id="settings-file-form-input" accept="image/*" onChange={handleFileUpload} />
          </label>
          <button className="btn icon-text-btn settings-file-form-submit-btn"
            disabled={submitButtonState.file || !image}>
            <Icon name="upload"/>
            <span>Upload</span>
            {submitButtonState.file && (
              <img src={spinner} className="settings-form-submit-btn-spinner" alt="" />
            )}
          </button>
        </div>
        {message.file && (
          <div className={`settings-form-message ${message.file.type}`}>
            <span>{message.file.value}</span>
            <button type="button" className="btn icon-btn settings-form-message-btn"
              onClick={() => hideMessage("file")} title="Dismiss">
              <Icon name="close" />
            </button>
          </div>
        )}
      </form>
      <form className="settings-form" onSubmit={handleUsernameChange} onKeyDown={handleKeydown}>
        <h3 className="settings-form-title">Change Username</h3>
        <div className="settings-username-form-group">
          <label className="settings-password-form-group">
            <div className="settings-form-field-title">Username</div>
            <input type="text" className="input settings-form-field"
              defaultValue={user.username} name="username" required/>
          </label>
          <button className="btn settings-username-form-submit-btn"
            disabled={submitButtonState.username}>
            <span>Change</span>
            {submitButtonState.username && (
              <img src={spinner} className="settings-form-submit-btn-spinner" alt="" />
            )}
          </button>
        </div>
        {message.username && (
          <div className={`settings-form-message ${message.username.type}`}>
            <span>{message.username.value}</span>
            <button type="button" className="btn icon-btn settings-form-message-btn"
              onClick={() => hideMessage("username")} title="Dismiss">
              <Icon name="close" />
            </button>
          </div>
        )}
      </form>
      <form className="settings-form" ref={passwordFormElement}
        onSubmit={handleChangePassword} onKeyDown={handlePasswordFormKeydown}>
        <h3 className="settings-form-title">Change Password</h3>
        {message.passwordForm && (
          <div className={`settings-form-message settings-password-form-message ${message.passwordForm.type}`}>
            <span>{message.passwordForm.value}</span>
            <button type="button" className="btn icon-btn settings-form-message-btn"
              onClick={() => hideMessage("passwordForm")} title="Dismiss">
              <Icon name="close" />
            </button>
          </div>
        )}
        <div className="settings-password-form-content">
          <label className="settings-password-form-group">
            <div className="settings-form-field-title">Current Password</div>
            <input type="password" className="input"
              name="currentPassword" required />
          </label>
          {message.currentPassword && (
            <div className="settings-form-field-message">{message.currentPassword.value}</div>
          )}
          <div className="settings-password-form-groups">
            <label className="settings-password-form-group">
              <div className="settings-form-field-title">New Password</div>
              <input type="password" className="input"
                name="newPassword" required />
            </label>
            <label className="settings-password-form-group">
              <div className="settings-form-field-title">Repeat New Password</div>
              <input type="password" className="input"
                name="newPassword" required />
            </label>
          </div>
          <div className="settings-form-field-message settings-password-form-field-message">{message.newPassword && message.newPassword.value}</div>
          <button className="btn settings-password-form-submit-btn"
            disabled={submitButtonState.passwordForm}>
            <span>Change Password</span>
            {submitButtonState.passwordForm && (
              <img src={spinner} className="settings-form-submit-btn-spinner" alt="" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
