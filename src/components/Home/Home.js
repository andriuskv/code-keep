import React from "react";
import { Link } from "react-router-dom";
import "./home.scss";
import img from "../../assets/home-image.png";

export default function Home() {
  const isFirefox = navigator.userAgent.includes("Firefox");

  return (
    <div className="home">
      <div>
        <h2 className="home-intro-main-title">CodeKeep</h2>
        <h2 className="home-intro-title">A Simple code<br />snippet manager</h2>
        <h3 className="home-intro-subtitle">Create and share your favorite snippets</h3>
        <Link to="/snippets/create" className="btn btn-secondary home-intro-btn">Get Started</Link>
      </div>
      <div className={`home-image-container${isFirefox ? "" : " shadow"}`}>
        <img src={img} className="home-image" alt=""/>
      </div>
    </div>
  );
}
