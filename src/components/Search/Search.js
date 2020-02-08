import React, { useState, useEffect, useRef, Fragment } from "react";
import { useLocation, useHistory } from "react-router-dom";
import uuidv4 from "uuid/v4";
import "./search.scss";
import { setDocumentTitle } from "../../utils";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE } from "../../messages";
import { useUser } from "../../context/user-context";
import { fetchQuery } from "../../services/serverService";
import { favoriteSnippet } from "../../services/userService";
import { createServerSnippet } from "../../services/snippetServerService";
import PageSpinner from "../PageSpinner";
import ButtonSpinner from "../ButtonSpinner";
import Icon from "../Icon";
import Notification from "../Notification";
import SnippetPreview from "../SnippetPreview";
import SnippetUserLink from "../SnippetUserLink";
import SearchDropdown from "./SearchDropdown";

export default function Search() {
  const location = useLocation();
  const history = useHistory();
  const user = useUser();
  const inputRef = useRef(null);
  const [state, setState] = useState(new URLSearchParams(location.search).get("q") || "");
  const [tab, setTab] = useState(null);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);
  const [searhing, setSearhing] = useState(false);

  useEffect(() => {
    if (history.action === "REPLACE") {
      return;
    }
    const query = new URLSearchParams(location.search).get("q") || "";

    if (query) {
      inputRef.current.value = query;
      search(query).then(() => setLoading(false));
      setDocumentTitle(`Search - ${query}`);
    }
    else {
      if (tab) {
        setTab(null);
      }
      inputRef.current.value = "";
      setLoading(false);
      setDocumentTitle("Search");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  function hideNotification() {
    setNotification("");
  }

  function handleSubmit(event) {
    const query = event.target.elements.query.value.trim();

    event.preventDefault();
    setSearhing(true);

    if (query) {
      setState(query);
      search(query).then(() => setSearhing(false));
      setDocumentTitle(`Search - ${query}`);

      history.replace({
        pathname: "/search",
        search: `?q=${query}`
      });
    }
  }

  async function search(query) {
    const data = await fetchQuery(query);

    if (data.code === 200) {
      if (tab) {
        setTab({ ...tab, snippets: data.snippets, users: data.users });
      }
      else {
        setTab({ name: "snippets", snippets: data.snippets, users: data.users });
      }
    }
    else {
      setNotification(GENERIC_ERROR_MESSAGE);
    }
  }

  function changeTab(tabName) {
    setTab({ ...tab, name: tabName });
  }

  async function forkSnippet(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const data = await createServerSnippet({
      ...snippet,
      files: snippet.files.map(file => {
        file.id = uuidv4();
        return file;
      }),
      userId: user._id,
      created: new Date(),
      id: uuidv4(),
      type: "forked",
      fork: {
        id: snippet.id,
        userId: snippet.userId
      }
    });

    if (data.code === 201) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        state: { type: "forked" }
      });
      return;
    }
    else if (data.code === 401) {
      setNotification(SESSION_EXPIRATION_MESSAGE);
    }
    else {
      setNotification(GENERIC_ERROR_MESSAGE);
    }
  }

  async function toggleSnippetFavoriteStatus(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const data = await favoriteSnippet(user.usernameLowerCase, {
      snippetId: snippet.id,
      username: snippet.user.usernameLowerCase,
      userId: snippet.userId,
      type: snippet.type
    });

    if (data.code === 201 || data.code === 204) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        state: { type: "favorite" }
      });
      return;
    }
    else {
      setNotification(data.message || GENERIC_ERROR_MESSAGE);
    }
  }

  function renderTabContent() {
    if (tab.name === "snippets") {
      if (!tab.snippets.length) {
        return <p className="search-not-found-message">Couldn't find any snippets with the title of <strong>{state}</strong>.</p>;
      }
      return (
        <ul>
          {tab.snippets.map((snippet) => (
            <SnippetPreview key={snippet.id} snippet={snippet} to={`/users/${snippet.user.usernameLowerCase}/${snippet.id}`}>
              {!user.username || user._id === snippet.user._id ? null : (
                <SearchDropdown snippet={snippet}
                  toggleSnippetFavoriteStatus={toggleSnippetFavoriteStatus}
                  forkSnippet={forkSnippet}/>
              )}
            </SnippetPreview>
          ))}
        </ul>
      );
    }

    if (!tab.users.length) {
      return <p className="search-not-found-message">Couldn't find any users with the username of <strong>{state}</strong>.</p>;
    }
    return (
      <ul>
        {tab.users.map((user, index) => {
          return (
            <li key={index} className="search-user">
              <SnippetUserLink user={user} to={`/users/${user.usernameLowerCase}`}/>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="container search">
      <h2 className="search-title">Search for snippets or users</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-form-input-container">
          <Icon name="search" className="search-form-input-icon"/>
          <input type="text" className="input search-form-input" name="query"
            placeholder="Search" defaultValue={state} ref={inputRef} required/>
        </div>
        <button className="btn search-form-btn" disabled={searhing}>
          <span>Search</span>
          {searhing && <ButtonSpinner/>}
        </button>
      </form>
      {notification && (
        <Notification className="search-notification"
          value={notification}
          dismiss={hideNotification}/>
      )}
      {loading && <PageSpinner/>}
      {tab && (
        <Fragment>
          <ul className="search-tabs">
            <li className="search-tabs-item">
              <button
                className={`btn search-tabs-item-btn${tab.name === "snippets" ? " active" : ""}`}
                onClick={() => changeTab("snippets")}>
                <span>Snippets</span>
                <span className="search-tabs-item-count">{tab.snippets.length}</span>
              </button>
            </li>
            <li className="search-tabs-item">
              <button
                className={`btn search-tabs-item-btn${tab.name === "users" ? " active" : ""}`}
                onClick={() => changeTab("users")}>
                <span>Users</span>
                <span className="search-tabs-item-count">{tab.users.length}</span>
              </button>
            </li>
          </ul>
          {renderTabContent()}
        </Fragment>
      )}
    </div>
  );
}
