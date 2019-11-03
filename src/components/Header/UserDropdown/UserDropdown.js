import React, { Fragment, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import "./user-dropdown.scss";
import { useUser } from "../../../context/user-context";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import spinner from "../../../assets/ring.svg";

export default function UserDropdown() {
  const [logout, setLogout] = useState({ buttonDisabled: false, message: "" });
  const { username, email, signOutUser } = useUser();
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
      content: <Icon name="user" />,
      title: "Toggle user menu",
      className: "btn icon-btn header-link header-dropdown-toggle-btn"
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
          {logout.buttonDisabled && (
            <img src={spinner} className="header-dropdown-btn-spinner" alt="" />
          )}
        </button>
        {logout.message && (
          <div className="header-dropdown-message">{logout.message}</div>
        )}
      </Fragment>
    </Dropdown>
  );
}
