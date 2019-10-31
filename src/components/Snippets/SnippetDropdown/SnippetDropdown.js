import React from "react";
import { useHistory } from "react-router-dom";
import "./snippet-dropdown.scss";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

export default function SnippetDropdown({ index, user, snippet, uploadSnippet, removeSnippet, toggleSnippetPrivacy }) {
  const history = useHistory();

  function editSnippet(id, isLocal) {
    history.push({
      pathname: isLocal ? `/snippets/${id}/edit` : `/users/${user.username}/${id}/edit`
    });
  }

  return (
    <Dropdown
      toggle={{ content: <Icon name="dots" />, title: "Toggle action menu", className: "btn icon-btn" }}
      body={{ className: "snippet-dropdown" }}>
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
        onClick={() => editSnippet(snippet.id, snippet.isLocal)}>
        <Icon name="edit" />
        <span>Edit</span>
      </button>
      {user.isLoggedIn && (
        snippet.isLocal ? (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => uploadSnippet(index)}>
            <Icon name="upload" />
            <span>Upload</span>
          </button>
        ) : (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => toggleSnippetPrivacy(snippet)}>
            <Icon name={snippet.isPrivate ? "unlocked" : "locked"} />
            <span>{snippet.isPrivate ? "Make Public" : "Make Private"}</span>
          </button>
        )
      )}
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
        onClick={() => removeSnippet(index, snippet.isLocal)}>
        <Icon name="trash" />
        <span>Remove</span>
      </button>
    </Dropdown>
  );
}
