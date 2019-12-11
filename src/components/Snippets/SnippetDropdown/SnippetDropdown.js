import React from "react";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

export default function SnippetDropdown({ authUser, snippetUser, snippet, forkSnippet, toggleSnippetFavoriteStatus }) {
  return (
    <Dropdown
      toggle={{ content: <Icon name="dots" />, title: "Toggle action menu", className: "btn icon-btn" }}
      body={{ className: "snippet-dropdown" }}>
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn" onClick={() => forkSnippet(snippet)}>
        <Icon name="fork" />
        <span>Fork</span>
      </button>
      {snippet.userId !== authUser._id && (
        <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
          onClick={() => toggleSnippetFavoriteStatus(snippet)}>
          <Icon name="star" />
          <span>{snippetUser.username === authUser.username ? "Unfavorite" : "Favorite"}</span>
        </button>
      )}
    </Dropdown>
  );
}
