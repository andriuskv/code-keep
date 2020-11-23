import { Fragment, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import "./user-dropdown.scss";
import { FAILED_LOGOUT_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import Dropdown from "../../Dropdown";
import ButtonSpinner from "../../ButtonSpinner";
import UserProfileImage from "../../UserProfileImage";

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
        setLogout({ buttonDisabled: false, message: FAILED_LOGOUT_MESSAGE });
      }
    } catch (e) {
      console.log(e);
      setLogout({ buttonDisabled: false, message: FAILED_LOGOUT_MESSAGE });
    }
  }

  function getToggleButton() {
    return {
      content:  <UserProfileImage src={profileImage.path}/>,
      title: "Toggle user menu",
      className: "btn icon-btn header-link header-dropdown-toggle-btn"
    };
  }

  return (
    <Dropdown toggle={getToggleButton()} body={{className: "header-dropdown"}}>
      <Fragment>
        <div className="header-dropdown-user-info">
          <UserProfileImage src={profileImage.path} size="48px" className="header-dropdown-image" />
          <div>
            <div className="header-dropdown-name">{username}</div>
            <div className="header-dropdown-email">{email}</div>
          </div>
        </div>
        <div className="header-dropdown-divider"></div>
        <Link to="/snippets/create" className="btn header-dropdown-link">Create Snippet</Link>
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
