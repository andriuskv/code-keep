import { useEffect } from "react";
import { setDocumentTitle } from "../../utils";
import { NON_EXISTENT_PAGE_MESSAGE } from "../../messages";
import "./no-match.scss";

export default function NoMatch({ message }) {
  useEffect(() => {
    setDocumentTitle("Page not found");
  }, [message]);

  return (
    <div className="no-match">
      <p className="no-match-message">{message ? message : NON_EXISTENT_PAGE_MESSAGE}</p>
    </div>
  );
}
