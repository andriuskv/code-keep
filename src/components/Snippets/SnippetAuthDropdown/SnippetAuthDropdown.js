import React from "react";
import { useHistory } from "react-router-dom";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

export default function SnippetAuthDropdown({ user, snippet, uploadSnippet, removeSnippet, toggleSnippetPrivacy }) {
  const history = useHistory();

  function editSnippet({ id, type }) {
    let path = `/users/${user.usernameLowerCase}/${id}/edit`;

    if (type === "local") {
      path = `/snippets/${id}/edit`;
    }
    else if (type === "gist") {
      path = `${path}?type=gist`;
    }
    history.push(path);
  }

  return (
    <Dropdown
      toggle={{ content: <Icon name="dots" />, title: "Toggle action menu", className: "btn icon-btn" }}
      body={{ className: "snippet-dropdown" }}>
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
        onClick={() => editSnippet(snippet)}>
        <Icon name="edit" />
        <span>Edit</span>
      </button>
      {user.isLoggedIn && (
        snippet.type === "local" ? (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => uploadSnippet(snippet)}>
            <Icon name="upload" />
            <span>Upload</span>
          </button>
        ) : snippet.type !== "gist" ? (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => toggleSnippetPrivacy(snippet)}>
            <Icon name={snippet.type === "private" ? "unlocked" : "locked"} />
            <span>{snippet.type === "private" ? "Make Public" : "Make Private"}</span>
          </button>
        ) : null
      )}
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
        onClick={() => removeSnippet(snippet)}>
        <Icon name="trash" />
        <span>Remove</span>
      </button>
    </Dropdown>
  );
}
