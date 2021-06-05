import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./github-connect.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { fetchUser } from "../../../services/userService";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import Notification from "../../Notification";

export default function GithubConnect() {
  const location = useLocation();
  const user = useUser();
  const [state, setState] = useState({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user.loading) {
      return;
    }
    const params = new URLSearchParams(location.search);

    if (params.get("status")) {
      setNotification({ value: GENERIC_ERROR_MESSAGE });
      setInitialized(true);
    }
    else if (user.isGithubConnected) {
      init();
    }
    else {
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function init() {
    try {
      const data = await fetchUser("me/github");

      if (data.code === 200) {
        setState(data);
      }
      else {
        setNotification({ value: GENERIC_ERROR_MESSAGE });
      }
    } catch (e) {
      console.log(e);
      setNotification({ value: GENERIC_ERROR_MESSAGE });
    } finally {
      setInitialized(true);
    }
  }

  function setNotification(value) {
    setState({ ...state, notification: value });
  }

  function removeNotification() {
    delete state.notification;
    setState({ ...state });
  }

  async function disconnect() {
    try {
      const status = await fetch("/api/users/disconnect").then(res => res.status);

      if (status === 204) {
        setState({});
        user.updateUser({
          isGithubConnected: false
        });
      }
      else {
        setNotification({ value: GENERIC_ERROR_MESSAGE });
      }
    } catch (e) {
      console.log(e);
      setNotification({ value: GENERIC_ERROR_MESSAGE });
    }
  }

  if (user.loading) {
    return null;
  }
  return (
    <div className="settings-item">
      <h3 className="settings-item-title settings-item-title-with-icon">
        <Icon name="github" className="settings-item-title-icon"/>
        <span>Github</span>
        {state.name ? (
          <button className="btn danger-btn github-header-btn" onClick={disconnect}>Disconnect</button>
        ) : initialized ? (
          <a href={`${process.env.REACT_APP_PROXY_SERVER_URL || ""}/api/users/connect/github`} className="btn github-header-btn">Connect</a>
        ) : null}
      </h3>
      {state.notification && (
        <Notification margin="bottom"
          notification={state.notification}
          dismiss={removeNotification}/>
      )}
      {state.name ? (
        <div className="github-profile-container">
          <img src={state.profileImage} className="github-profile-image" width="64px" height="64px" alt=""/>
          <div className="github-profile-info">
            <div className="github-profile-name">{state.name}</div>
            <a href={state.url} className="github-profile-link">
              <Icon name="link" className="github-profile-link-icon"/>
              <span className="github-profile-username">{state.username}</span>
            </a>
          </div>
        </div>
      ) : initialized ? (
        <p>Connect to GitHub to gain access to your gists.</p>
      ) : null}
    </div>
  );
}
