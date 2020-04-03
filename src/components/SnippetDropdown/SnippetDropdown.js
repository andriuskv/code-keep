import React from "react";
import { useHistory } from "react-router-dom";
import "./snippet-dropdown.scss";
import Dropdown from "../Dropdown";
import Icon from "../Icon";

export default function SnippetDropdown(props) {
  const history = useHistory();
  const { snippet, authUser, snippetUser } = props;

  function editSnippet() {
    const { id, type } = snippet;
    let path = `/users/${authUser.usernameLowerCase}/${id}/edit`;

    if (type === "local") {
      path = `/snippets/${id}/edit`;
    }
    else if (type === "gist") {
      path = `${path}?type=gist`;
    }
    history.push(path);
  }

  function uploadSnippet() {
    props.uploadSnippet(snippet);
  }

  function toggleSnippetPrivacy() {
    props.toggleSnippetPrivacy(snippet);
  }

  function removeSnippet() {
    props.removeSnippet(snippet);
  }

  function forkSnippet() {
    props.forkSnippet(snippet);
  }

  function toggleSnippetFavoriteStatus() {
    props.toggleSnippetFavoriteStatus(snippet);
  }

  const dropdownOptions = [];
  const isAuth = snippetUser.isLocal || snippetUser._id === authUser._id;

  if (isAuth && snippet.type !== "favorite") {
    dropdownOptions.push({
      name: "Edit",
      icon: "edit",
      callback: editSnippet
    });

    if (snippetUser.isLoggedIn) {
      if (snippet.type === "local") {
        dropdownOptions.push({
          name: "Upload",
          icon: "upload",
          callback: uploadSnippet
        });
      }
      else if (snippet.type !== "gist" && snippet.type !== "forked") {
        const isPrivateSnippet = snippet.type === "private";

        dropdownOptions.push({
          name: isPrivateSnippet ? "Make Public" : "Make Private",
          icon: isPrivateSnippet ? "unlocked" : "locked",
          callback: toggleSnippetPrivacy
        });
      }
    }
    dropdownOptions.push({
      name: "Remove",
      icon: "trash",
      callback: removeSnippet
    });
  }
  else if (authUser._id) {
    dropdownOptions.push({
      name: "Fork",
      icon: "fork",
      callback: forkSnippet
    });

    if (snippet.userId !== authUser._id) {
      dropdownOptions.push({
        name: snippet.type === "favorite" ? "Unfavorite" : "Favorite",
        icon: "star",
        callback: toggleSnippetFavoriteStatus
      });
    }
  }

  return (
    <Dropdown
      toggle={{
        content: <Icon name="dots"/>,
        title: "Toggle action menu",
        className: `btn icon-btn${props.toggleBtnClassName ? ` ${props.toggleBtnClassName}`: ""}` }}
      body={{ className: "snippet-dropdown" }}>
      {dropdownOptions.map((option, index) => (
        <button className="btn icon-text-btn dropdown-btn snippet-dropdown-btn" key={index}
          onClick={option.callback}>
          <Icon name={option.icon}/>
          <span>{option.name}</span>
        </button>
      ))}
    </Dropdown>
  );
}
