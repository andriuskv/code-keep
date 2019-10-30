import React, { useState, useEffect, useCallback } from "react";
import "./dropdown.scss";
import { getRandomString } from "../../utils";

export default function Dropdown({ toggle, body, children, hideOnNavigation = false }) {
  const [{ id, visible}, setState] = useState({ visible: false, id: "" });
  const memoizedWindowClickHandler = useCallback(handleWindowClick, [id]);

  useEffect(() => {
    setState({ visible, id: getRandomString() });

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
    setState({ id, visible: !visible });
  }

  function handleWindowClick({ target }) {
    const closestContanier = target.closest(".dropdown-container");

    if (!closestContanier || id !== closestContanier.id) {
      const closestLink = target.closest("a");

      if (!closestLink || hideOnNavigation) {
        setState({ id, visible: false });
      }
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
    else if (target.closest("[data-dropdown-keep]")) {
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
    else if (target.closest("a") || target.closest(".dropdown-btn")) {
      window.removeEventListener("click", memoizedWindowClickHandler);
      setState({ id, visible: false });
    }
  }

  return (
    <div id={id} className="dropdown-container">
      <button onClick={toggleDropdown}
        title={toggle.title}
        className={`dropdown-toggle-btn ${toggle.className}${visible ? " active" : ""}`}>
        {toggle.content}
      </button>
      <div className={`dropdown${body ? ` ${body.className}` : ""}${visible ? " visible" : ""}`}>{children}</div>
    </div>
  );
}
