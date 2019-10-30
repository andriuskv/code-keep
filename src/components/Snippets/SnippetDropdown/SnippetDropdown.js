import React from "react";
import { withRouter } from "react-router-dom";
import "./snippet-dropdown.scss";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";

function SnippetDropdown({ history, index, user, snippet, uploadSnippet, removeSnippet, toggleSnippetPrivacy }) {
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
        onClick={() => editSnippet(snippet.id, snippet.isLocal)} data-dropdown-keep>
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

export default withRouter(SnippetDropdown);
