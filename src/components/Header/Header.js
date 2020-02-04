import React, { Fragment } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./header.scss";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import Dropdown from "../Dropdown";
import UserDropdown from "./UserDropdown";
import Search from "./Search";
import logoFull from "../../assets/logo-full.svg";
import spinner from "../../assets/ring.svg";

export default function Header() {
  const location = useLocation();
  const { usernameLowerCase, loading } = useUser();

  function renderItems() {
    if (loading) {
      return <img src={spinner} className="header-spinner" height="20px" alt="" />;
    }

    if (usernameLowerCase) {
      return (
        <Fragment>
          <li className="header-nav-item">
            <Dropdown
              toggle={{ content: <Icon name="menu" />, title: "Toggle navigation menu", className: "btn icon-btn header-nav-dropdown-toggle-btn" }}
              body={{ className: "header-nav-dropdown" }}>
              <NavLink to="/snippets/recent" className="btn text-btn header-link" activeClassName="active">Recent</NavLink>
              <NavLink to={usernameLowerCase ? `/users/${usernameLowerCase}` : "/snippets"} exact
                className="btn text-btn header-link" activeClassName="active">Snippets</NavLink>
            </Dropdown>
          </li>
          <li className="header-nav-item"><UserDropdown/></li>
        </Fragment>
      );
    }
    return (
      <li className="header-nav-item">
        <Dropdown
          toggle={{ content: <Icon name="menu" />, title: "Toggle navigation menu", className: "btn icon-btn header-nav-dropdown-toggle-btn" }}
          body={{ className: "header-nav-dropdown" }}>
          <NavLink to="/snippets/recent" className="btn text-btn header-link" activeClassName="active">Recent</NavLink>
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
              <img src={logoFull} height="20px" alt="CodeKeep" />
            </Link>
          </li>
          {location.pathname !== "/search" && (
            <Fragment>
              <li className="header-nav-item"><Search/></li>
              <li className="header-nav-item header-search-item">
                <NavLink to="/search" className="btn text-btn header-link header-search-link" title="Search">
                  <Icon name="search"/>
                  <span>Search</span>
                </NavLink>
              </li>
            </Fragment>
          )}
          {renderItems()}
        </ul>
      </nav>
    </header>
  );
}
