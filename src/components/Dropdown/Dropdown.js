import { useState, useEffect, useRef, useCallback } from "react";
import "./dropdown.scss";
import { getRandomString } from "../../utils";

export default function Dropdown({ toggle, body, children }) {
  const [{ id, visible }, setState] = useState({ visible: false, id: "" });
  const memoizedWindowClickHandler = useCallback(handleWindowClick, [id]);
  const isMounted = useRef(false);

  useEffect(() => {
    setState({ visible, id: getRandomString() });
    isMounted.current = true;

    return () => {
      isMounted.current = false;
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
    const closestContainer = target.closest(".dropdown-container");
    let hideDropdown = true;

    if (closestContainer && closestContainer.id === id) {
      if (target.closest("[data-dropdown-keep]")) {
        hideDropdown = false;
      }
      else {
        hideDropdown = target.closest("a") || target.closest(".dropdown-btn");
      }
    }

    if (hideDropdown) {
      if (isMounted.current) {
        setState({ id, visible: false });
      }
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
  }

  return (
    <div id={id} className="dropdown-container">
      <button onClick={toggleDropdown}
        title={toggle.title}
        className={`${toggle.className}${visible ? " active" : ""}`}>
        {toggle.content}
      </button>
      <div className={`dropdown${body ? ` ${body.className}` : ""}${visible ? " visible" : ""}`}>{children}</div>
    </div>
  );
}
