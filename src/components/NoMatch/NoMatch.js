import React, { useEffect } from "react";
import { setDocumentTitle } from "../../utils";
import "./no-match.scss";

export default function NoMatch({ message }) {
  useEffect(() => {
    setDocumentTitle("Page not found");
  }, [message]);

  return (
    <div className="no-match">
      <p className="no-match-message">{message ? message : "This page doesn't exists."}</p>
    </div>
  );
}
