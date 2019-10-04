import React, { useState, useEffect, useCallback } from "react";
import "./dropdown.scss";

export default function Dropdown({ toggle, body, children }) {
  const [visible, setVisibility] = useState(false);
  const memoizedWindowClickHandler = useCallback(handleWindowClick, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDropdown() {
    if (visible) {
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
    else {
      window.addEventListener("click", memoizedWindowClickHandler);
    }
    setVisibility(!visible);
  }

  function handleWindowClick(event) {
    if (!event.target.closest(".dropdown-container")) {
      window.removeEventListener("click", memoizedWindowClickHandler);
      setVisibility(false);
    }
    else if (event.target.closest("a")) {
      window.removeEventListener("click", memoizedWindowClickHandler);
      setVisibility(false);
    }
  }

  return (
    <div className="dropdown-container">
      <button onClick={toggleDropdown}
        className={`${toggle.className}${visible ? " active" : ""}`}>
        {toggle.content}
      </button>
      <div className={`dropdown${body ? ` ${body.className}` : ""}${visible ? " visible" : ""}`}>{children}</div>
    </div>
  );
}
