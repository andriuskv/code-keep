import React, { useState, useEffect, useCallback } from "react";
import "./dropdown.scss";
import Icon from "../../Icon";

export default function Dropdown({ file, previewMarkdown }) {
  const [visible, setVisibility] = useState(false);
  const memoizedWindowClickHandler = useCallback(handleWindowClick, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyFileContent(value) {
    navigator.clipboard.writeText(value).catch(error => {
      console.log(error);
    });
  }

  function downloadFile(file) {
    const url = URL.createObjectURL(new Blob([file.value], { type: file.mimeType }));
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }

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
    if (!event.target.closest(".view-editor-header-menu")) {
      window.removeEventListener("click", memoizedWindowClickHandler);
      setVisibility(false);
    }
  }

  return (
    <div className="view-editor-header-menu">
      <button onClick={toggleDropdown}
        className="btn icon-btn view-editor-header-menu-toggle-btn">
        <Icon name="menu" />
      </button>
      <div className={`view-editor-header-menu-items${visible ? " visible" : ""}`}>
        {file.mode === "gfm" && (
          <button onClick={() => previewMarkdown(file)}
            className={`btn icon-text-btn view-editor-header-btn${file.renderAsMarkdown ? " active" : ""}`}>
            <Icon name="eye" />
            <span>Preview</span>
          </button>
        )}
        <button onClick={() => copyFileContent(file.value)}
          className="btn icon-text-btn view-editor-header-btn">
          <Icon name="clipboard" />
          <span>Copy</span>
        </button>
        <button onClick={() => downloadFile(file)}
          className="btn icon-text-btn view-editor-header-btn">
          <Icon name="download" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}
