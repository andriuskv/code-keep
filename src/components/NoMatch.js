import React, { useEffect } from "react";
import { setDocumentTitle } from "../utils";

export default function NoMatch() {
  useEffect(() => {
    setDocumentTitle("Page unavailable");
  }, []);

  return <p className="no-match-message">This page isn't available</p>;
}
