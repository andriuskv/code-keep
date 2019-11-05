import React, { useState, useEffect } from "react";
import "./user-settings.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import { updateUser, uploadProfileImage } from "../../services/userService";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";

export default function UserSettings(props) {
  const [message, setFormMessage] = useState({});
  const [image, setImage] = useState(null);
  const user = useUser();

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
    } catch (e) {
      console.log(e);
      setMessage("file", { value: "Something went wrong. Try again later." });
    }
  }

  function showFileSelection(event) {
    if (event.key === "Enter" || event.key === " ") {
      document.getElementById("settings-form-file-input").click();
    }
  }

  function hideMessage(name) {
    delete message[name];
    setFormMessage({ ...message });
  }

  function handleKeydown({ target }) {
    if (message[target.name]) {
      hideMessage(target.name);
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
      setMessage("username", { value: "Can't change to the same username." });
      return;
    }
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
  }

  function setMessage(formName, { value, type = "error" }) {
    setFormMessage({ ...message, [formName]: { value, type } });
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
            <div className="settings-form-file-preview-container">
              <img src={URL.createObjectURL(image.blob)} className="settings-form-file-preview" alt="" />
            </div>
          ) : user.profileImage ? (
            <div className="settings-form-file-preview-container">
              <img src={user.profileImage} className="settings-form-file-preview" alt="" />
            </div>
          ) : <Icon name="user" className="settings-form-file-default-preview" />}
          <label className="btn settings-form-file-input-btn" tabIndex="0" onKeyDown={showFileSelection}>
            <span>Select an image</span>
            <input type="file" id="settings-form-file-input" accept="image/*" onChange={handleFileUpload} />
          </label>
          <button className="btn icon-text-btn settings-form-file-submit-btn" disabled={!image}>
            <Icon name="upload"/>
            <span>Upload</span>
          </button>
        </div>
        {message.file && <p className={`settings-form-message ${message.file.type}`}>{message.file.value}</p>}
      </form>
      <form onSubmit={handleUsernameChange} onKeyDown={handleKeydown} className="settings-form">
        <h3 className="settings-form-title">Change Username</h3>
        <div className="settings-form-group">
          <input type="text" className="input settings-form-field"
            defaultValue={user.username} name="username" required/>
          <button className="btn settings-form-username-submit-btn">Change</button>
        </div>
        {message.username && <p className={`settings-form-message ${message.username.type}`}>{message.username.value}</p>}
      </form>
    </div>
  );
}
