import React, { Fragment, useState } from "react";
import { withRouter, Link } from "react-router-dom";
import "./user-dropdown.scss";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import spinner from "../../../assets/ring.svg";

function UserDropdown(props) {
  const [logoutButtonState, setLogoutButtonState] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const { username, email, signOutUser } = useUser();

  async function handleLogout() {
    try {
      setLogoutButtonState(true);
      setLogoutMessage("");
      const didLogout = await signOutUser();

      if (didLogout) {
        props.history.replace("/login");
      }
      else {
        setLogoutButtonState(false);
        setLogoutMessage("Could not logout. Try again later.");
      }
    } catch (e) {
      console.log(e);
      setLogoutButtonState(false);
      setLogoutMessage("Could not logout. Try again later.");
    }
  }

  function getToggleButton() {
    return {
      content: <Icon name="user" />,
      title: "Toggle user menu",
      className: "btn icon-btn header-link header-dropdown-toggle-btn"
    };
  }

  return (
    <Dropdown
      toggle={getToggleButton()}
      body={{className: "header-dropdown"}} hideOnNavigation>
      <Fragment>
        <div className="header-dropdown-name">{username}</div>
        <div className="header-dropdown-email">{email}</div>
        <div className="header-dropdown-divider"></div>
        <Link to="/change/password" className="btn header-dropdown-link">Change Password</Link>
        <button className="btn dropdown-btn header-dropdown-btn"
          onClick={handleLogout} disabled={logoutButtonState}>
          <span>Logout</span>
          {logoutButtonState && (
            <img src={spinner} className="header-dropdown-btn-spinner" alt="" />
          )}
        </button>
        {logoutMessage && (
          <div className="header-dropdown-message">{logoutMessage}</div>
        )}
      </Fragment>
    </Dropdown>
  );
}

export default withRouter(UserDropdown);
