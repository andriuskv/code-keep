import React, { useEffect } from "react";
import { setDocumentTitle } from "../../utils";
import "./no-match.scss";
import img from "../../assets/header-image.png";

export default function NoMatch({ message }) {
  useEffect(() => {
    setDocumentTitle("Page not found");
  }, [message]);

  return (
    <div className="no-match">
      <img src={img} className="no-match-image" alt="CodeKeep" />
      <p className="no-match-message">{message ? message : "This page doesn't exists."}</p>
    </div>
  );
}
