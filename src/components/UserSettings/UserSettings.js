import React, { useState, useEffect } from "react";
import "./user-settings.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import { updateUser } from "../../services/userService";
import spinner from "../../assets/ring.svg";

export default function UserSettings(props) {
  const [message, setMessage] = useState({});
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

  function hideMessage(name) {
    delete message[name];
    setMessage({ ...message });
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
      setMessage({ username: "Username can only contain alphanumeric characters." });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setMessage({ username: "Username length shuold be between 3 and 20 characters." });
      return;
    }

    if (username === user.username) {
      setMessage({ username: "Can't change to the same username." });
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
    } else if (data.code === 400 && data.message) {
      setMessage({ username: data.message });
    }
    else {
      setMessage({ username: "Something went wrong. Try again later." });
    }
  }

  if (user.loading) {
    return <img src={spinner} className="snippets-spinner" alt="" />;
  }
  return (
    <div>
      <h2>Settings</h2>
      <div>{user.username}</div>
      <div>{user.email}</div>
      <form onSubmit={handleUsernameChange} onKeyDown={handleKeydown} className="settings-form">
        <h3 className="settings-form-title">Change Username</h3>
        <div className="settings-form-group">
          <label>
            <div className="settings-form-field-title">Username</div>
            <input type="text" className={`input settings-form-field${message.username ? " invalid": ""}`}
              defaultValue={user.username} name="username" required/>
          </label>
          <button className="btn">Change Username</button>
        </div>
        {message.username && <p className="settings-form-field-message">{message.username}</p>}
      </form>
    </div>
  );
}
