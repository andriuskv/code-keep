import React from "react";
import { useHistory } from "react-router-dom";
import "./snippet-dropdown.scss";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

export default function SnippetDropdown({ index, user, snippet, uploadSnippet, removeSnippet, toggleSnippetPrivacy }) {
  const history = useHistory();

  function editSnippet({ id, isLocal, isGist }) {
    let path = `/users/${user.usernameLowerCase}/${id}/edit`;

    if (isLocal) {
      path = `/snippets/${id}/edit`;
    }
    else if (isGist) {
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
        snippet.isLocal ? (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => uploadSnippet(index)}>
            <Icon name="upload" />
            <span>Upload</span>
          </button>
        ) : !snippet.isGist ? (
          <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
            onClick={() => toggleSnippetPrivacy(snippet)}>
            <Icon name={snippet.isPrivate ? "unlocked" : "locked"} />
            <span>{snippet.isPrivate ? "Make Public" : "Make Private"}</span>
          </button>
        ) : null
      )}
      <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn"
        onClick={() => removeSnippet(index, snippet)}>
        <Icon name="trash" />
        <span>Remove</span>
      </button>
    </Dropdown>
  );
}
