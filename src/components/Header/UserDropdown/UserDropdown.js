import React, { Fragment, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import "./user-dropdown.scss";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import ButtonSpinner from "../../ButtonSpinner";

export default function UserDropdown() {
  const [logout, setLogout] = useState({ buttonDisabled: false, message: "" });
  const { username, email, profileImage, signOutUser } = useUser();
  const history = useHistory();

  async function handleLogout() {
    try {
      setLogout({ buttonDisabled: true, message: "" });
      const didLogout = await signOutUser();

      if (didLogout) {
        history.replace("/login");
      }
      else {
        setLogout({ buttonDisabled: false, message: "Could not logout. Try again later." });
      }
    } catch (e) {
      console.log(e);
      setLogout({ buttonDisabled: false, message: "Could not logout. Try again later." });
    }
  }

  function getToggleButton() {
    return {
      content: profileImage ? (
        <div className="header-dropdown-profile-image-container">
          <img src={profileImage} className="header-dropdown-profile-image" alt="" />
        </div>
      ) : <Icon name="user" />,
      title: "Toggle user menu",
      className: `btn icon-btn header-link header-dropdown-toggle-btn${profileImage ? " with-image" : ""}`
    };
  }

  return (
    <Dropdown toggle={getToggleButton()} body={{className: "header-dropdown"}}>
      <Fragment>
        <div className="header-dropdown-name">{username}</div>
        <div className="header-dropdown-email">{email}</div>
        <div className="header-dropdown-divider"></div>
        <Link to="/settings" className="btn header-dropdown-link">Settings</Link>
        <button className="btn dropdown-btn header-dropdown-btn"
          onClick={handleLogout} disabled={logout.buttonDisabled} data-dropdown-keep>
          <span>Logout</span>
          {logout.buttonDisabled && <ButtonSpinner/>}
        </button>
        {logout.message && (
          <div className="header-dropdown-message">{logout.message}</div>
        )}
      </Fragment>
    </Dropdown>
  );
}
