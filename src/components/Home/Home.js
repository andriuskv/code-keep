import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./home.scss";
import HomeVisual from "./HomeVisual";
import logoFull from "../../assets/logo-full.svg";

export default function Home() {
  useEffect(() => {
    document.title = "CodeKeep - Code Snippet Manager";
  }, []);

  return (
    <div className="home-container">
      <div className="container home">
        <div>
          <img src={logoFull} className="home-intro-logo" alt="codekeep" height="32px"/>
          <h2 className="home-intro-title">A Simple Code<br />Snippet Manager</h2>
          <h3 className="home-intro-subtitle">Create and share your favorite snippets</h3>
          <Link to="/snippets/create" className="btn btn-secondary home-intro-btn">Get Started</Link>
        </div>
        <HomeVisual/>
      </div>
    </div>
  );
}
