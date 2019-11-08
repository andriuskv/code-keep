import React, { Fragment } from "react";
import { Link, NavLink } from "react-router-dom";
import "./header.scss";
import img from "../../assets/header-image.png";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import Dropdown from "../Dropdown";
import UserDropdown from "./UserDropdown";

export default function Header() {
  const { usernameLowerCase, loading } = useUser();

  function renderItems() {
    if (loading) {
      return null;
    }

    if (usernameLowerCase) {
      return (
        <Fragment>
          <li className="header-nav-item">
            <NavLink to={usernameLowerCase ? `/users/${usernameLowerCase}` : "/snippets"} exact
              className="btn text-btn header-link" activeClassName="active">Snippets</NavLink>
          </li>
          <li className="header-nav-item"><UserDropdown /></li>
        </Fragment>
      );
    }
    return (
      <li className="header-nav-item">
        <Dropdown
          toggle={{ content: <Icon name="menu" />, title: "Toggle navigation menu", className: "btn icon-btn header-nav-dropdown-toggle-btn" }}
          body={{ className: "header-nav-dropdown" }}>
          <NavLink to={usernameLowerCase ? `/users/${usernameLowerCase}` : "/snippets"} exact
            className="btn text-btn header-link" activeClassName="active">Snippets</NavLink>
          <NavLink to="/login" className="btn text-btn header-link" activeClassName="active">Log In</NavLink>
          <NavLink to="/register" className="btn text-btn header-link" activeClassName="active">Sign Up</NavLink>
        </Dropdown>
      </li>
    );
  }

  return (
    <header className="header">
      <nav className="header-nav">
        <ul className="header-nav-items">
          <li className="header-nav-item">
            <Link to="/" className="header-home-link">
              <img src={img} alt="CodeKeep" />
            </Link>
          </li>
          {renderItems()}
        </ul>
      </nav>
    </header>
  );
}
