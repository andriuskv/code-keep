import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./header.scss";
import img from "../../assets/header-image.png";

export default function Header() {
  return (
    <header className="header">
      <nav className="header-nav">
        <ul className="header-nav-items">
          <li className="header-nav-item">
            <Link to="/" className="header-home-link">
              <img src={img} alt="CodeKeep" />
            </Link>
          </li>
          <li className="header-nav-item">
            <NavLink to="/snippets" exact className="header-link" activeClassName="active">Your Snippets</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
