import React, { useState, useEffect, useRef, Fragment } from "react";
import { useLocation, useHistory, Link } from "react-router-dom";
import uuidv4 from "uuid/v4";
import "./search.scss";
import { setDocumentTitle } from "../../utils";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE, NON_EXISTENT_PAGE_MESSAGE } from "../../messages";
import { useUser } from "../../context/user-context";
import { fetchQuery } from "../../services/serverService";
import { favoriteSnippet } from "../../services/userService";
import { createServerSnippet } from "../../services/snippetServerService";
import PageSpinner from "../PageSpinner";
import ButtonSpinner from "../ButtonSpinner";
import Icon from "../Icon";
import NoMatch from "../NoMatch";
import Notification from "../Notification";
import SnippetPreview from "../SnippetPreview";
import SnippetUserLink from "../SnippetUserLink";
import SearchDropdown from "./SearchDropdown";

export default function Search() {
  const location = useLocation();
  const history = useHistory();
  const user = useUser();
  const inputRef = useRef(null);
  const [state, setState] = useState({
    query: new URLSearchParams(location.search).get("q") || "",
    page: 1,
    loading: true,
    searching: false
  });
  const [tab, setTab] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabName = searchParams.get("tab") || "snippets";
    const query = searchParams.get("q") || "";
    const page = searchParams.get("page") || 1;
    delete state.message;

    if (query) {
      if (inputRef.current) {
        inputRef.current.value = query;
      }
      setDocumentTitle(`Search - ${query}`);
      search(state, { query, tabName, page });
    }
    else {
      if (tab) {
        setTab(null);
      }
      inputRef.current.value = "";
      setState({ ...state, loading: false });
      setDocumentTitle("Search");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  function handleSubmit(event) {
    const query = event.target.elements.query.value.trim();

    event.preventDefault();

    if (query) {
      setState({ ...state, searching: true });
      setQueryParam("q", query);
    }
  }

  async function search(state, { query, tabName, page }) {
    const newState = {
      ...state,
      query,
      page: parseInt(page, 10),
      searching: false,
      loading: false
    };

    try {
      const data = await fetchQuery(query, { tabName, page });

      if (data.code === 200) {
        if (state.searching || state.loading) {
          if (data.itemCounts.snippets && !data.itemCounts.users && tabName === "users") {
            setQueryParam("tab", "snippets");
            return;
          }
          else if (data.itemCounts.users && !data.itemCounts.snippets && tabName === "snippets") {
            setQueryParam("tab", "users");
            return;
          }
        }
        setTab({
          name: tabName,
          items: data.items,
          itemCounts: data.itemCounts,
          hasMorePages: data.hasMorePages
        });
      }
      else if (data.code === 404) {
        newState.message = NON_EXISTENT_PAGE_MESSAGE;
      }
      else {
        newState.notification = GENERIC_ERROR_MESSAGE;
      }

      if (state.page !== newState.page) {
        window.scrollTo(0, 0);
      }
      setState(newState);
    } catch (e) {
      console.log(e);
      newState.notification = GENERIC_ERROR_MESSAGE;
      setState(newState);
    }
  }

  function changeTab(tabName) {
    if (tab.name === tabName) {
      return;
    }
    const search = new URLSearchParams(location.search);

    search.delete("page");
    search.set("tab", tabName);
    history.replace({
      pathname: location.pathname,
      search: search.toString()
    });
  }

  function setQueryParam(name, value) {
    const search = new URLSearchParams(location.search);
    search.set(name, value);
    history.replace({
      pathname: location.pathname,
      search: search.toString()
    });
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
        search: "?type=fork"
      });
      return;
    }
    else if (data.code === 401) {
      setState({ ...state, notification: data.message || SESSION_EXPIRATION_MESSAGE });
    }
    else {
      setState({ ...state, notification: GENERIC_ERROR_MESSAGE });
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
        search: "?type=favorite"
      });
      return;
    }
    else {
      setState({ ...state, notification: data.message || GENERIC_ERROR_MESSAGE });
    }
  }

  function renderTabContent() {
    if (tab.name === "snippets") {
      if (!tab.itemCounts.snippets) {
        return <p className="search-not-found-message">Couldn't find any snippets with the title of <strong>{state.query}</strong>.</p>;
      }
      return (
        <ul>
          {tab.items.map((snippet) => (
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

    if (!tab.itemCounts.users) {
      return <p className="search-not-found-message">Couldn't find any users with the username of <strong>{state.query}</strong>.</p>;
    }
    return (
      <ul>
        {tab.items.map((user, index) => {
          return (
            <li key={index} className="search-user">
              <SnippetUserLink user={user} to={`/users/${user.usernameLowerCase}`}/>
            </li>
          );
        })}
      </ul>
    );
  }

  function renderPageLinks() {
    const pathname = location.pathname;
    const searchNewer = new URLSearchParams(location.search);
    const searchOlder = new URLSearchParams(location.search);

    searchNewer.set("page", state.page - 1);
    searchOlder.set("page", state.page + 1);

    return (
      <div className="search-footer">
        {state.page > 1 ? (
          <Link to={`${pathname}?${searchNewer.toString()}`} className="btn">Newer</Link>
        ) : <button className="btn" disabled>Newer</button>}
        {tab.hasMorePages ? (
          <Link to={`${pathname}?${searchOlder.toString()}`} className="btn">Older</Link>
        ) : <button className="btn" disabled>Older</button>}
      </div>
    );
  }

  if (state.message) {
    return <NoMatch message={state.message}/>;
  }
  return (
    <div className="container search">
      <h2 className="search-title">Search for snippets or users</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-form-input-container">
          <Icon name="search" className="search-form-input-icon"/>
          <input type="text" className="input search-form-input" name="query"
            placeholder="Search" defaultValue={state.query} ref={inputRef} required/>
        </div>
        <button className="btn search-form-btn" disabled={state.searhing}>
          <span>Search</span>
          {state.searhing && <ButtonSpinner/>}
        </button>
      </form>
      {state.notification && (
        <Notification className="search-notification"
          value={state.notification}
          dismiss={hideNotification}/>
      )}
      {state.loading && <PageSpinner/>}
      {tab && (
        <Fragment>
          <ul className="search-tabs">
            <li className="search-tabs-item">
              <button
                className={`btn search-tabs-item-btn${tab.name === "snippets" ? " active" : ""}`}
                onClick={() => changeTab("snippets")}>
                <span>Snippets</span>
                <span className="search-tabs-item-count">{tab.itemCounts.snippets}</span>
              </button>
            </li>
            <li className="search-tabs-item">
              <button
                className={`btn search-tabs-item-btn${tab.name === "users" ? " active" : ""}`}
                onClick={() => changeTab("users")}>
                <span>Users</span>
                <span className="search-tabs-item-count">{tab.itemCounts.users}</span>
              </button>
            </li>
          </ul>
          {renderTabContent()}
          {renderPageLinks()}
        </Fragment>
      )}
    </div>
  );
}
