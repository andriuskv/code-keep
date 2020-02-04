import React from "react";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

export default function SearchDropdown({ snippet, forkSnippet, toggleSnippetFavoriteStatus }) {
  return (
    <Dropdown
      toggle={{ content: <Icon name="dots" />, title: "Toggle action menu", className: "btn icon-btn" }}
      body={{ className: "search-snippet-dropdown" }}>
      <button className="btn icon-text-btn dropdown-btn search-snippet-dropdown-btn" onClick={() => forkSnippet(snippet)}>
        <Icon name="fork" />
        <span>Fork</span>
      </button>
      <button className="btn icon-text-btn dropdown-btn search-snippet-dropdown-btn"
        onClick={() => toggleSnippetFavoriteStatus(snippet)}>
        <Icon name="star" />
        <span>Favorite</span>
      </button>
    </Dropdown>
  );
}
