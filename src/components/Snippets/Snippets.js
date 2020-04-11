import React, { useState, useEffect, Fragment } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import "./snippets.scss";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE, NON_EXISTENT_PAGE_MESSAGE } from "../../messages";
import { setDocumentTitle } from "../../utils";
import { fetchUser, favoriteSnippet } from "../../services/userService";
import { fetchIDBSnippets } from "../../services/snippetIDBService";
import { fetchSnippets, deleteSnippet, sortSnippets } from "../../services/snippetService";
import { fetchServerSnippets, createServerSnippet, updateServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import Notification from "../Notification";
import SnippetPreview from "../SnippetPreview";
import NoMatch from "../NoMatch";
import UserProfileImage from "../UserProfileImage";
import SnippetDropdown from "../SnippetDropdown";
import SnippetRemoveModal from "../SnippetRemoveModal";

export default function Snippets() {
  const history = useHistory();
  const { username } = useParams();
  const [state, setState] = useState({
    snippets: [],
    loading: true,
    user: null
  });
  const user = useUser();
  const { location } = history;
  const snippetsPerPage = 10;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/snippets") {
      if (state.snippets.length) {
        showSnippets(state, "");
      }
      return;
    }

    if (state.user?.usernameLowerCase === username.toLowerCase()) {
      setSnippetState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (state.notification && window.scrollY >= 100) {
      window.scrollTo(0, 0);
    }
  }, [state.notification]);

  function setSnippetState(state) {
    const type = new URLSearchParams(location.search).get("type") || "";

    if (state.user?.usernameLowerCase !== user.usernameLowerCase) {
      const allowedTypes = ["all", "forked", "favorite"];

      if (type && !allowedTypes.includes(type)) {
        setState({ ...state, message: NON_EXISTENT_PAGE_MESSAGE });
        return;
      }
    }
    delete state.message;
    showSnippets(state, type);
  }

  function updateSnippetTypeCount(snippets) {
    const tabs = {
      all: {
        name: "All",
        type: "",
        count: 0
      },
      remote: {
        name: "Remote",
        type: "remote",
        require: true,
        count: 0
      },
      private: {
        name: "Private",
        type: "private",
        iconName: "locked",
        require: true,
        count: 0
      },
      forked: {
        name: "Forked",
        type: "forked",
        iconName: "fork",
        count: 0
      },
      gist: {
        name: "Gists",
        type: "gist",
        iconName: "github",
        require: true,
        count: 0
      },
      local: {
        name: "Local",
        type: "local",
        iconName: "home",
        require: true,
        count: 0
      },
      favorite: {
        name: "Favorites",
        type: "favorite",
        iconName: "star",
        count: 0
      }
    };

    for (const snippet of snippets) {
      tabs.all.count += 1;

      if (snippet.type === "private" || snippet.type === "forked") {
        tabs.remote.count += 1;
      }
      tabs[snippet.type].count += 1;
    }
    return tabs;
  }

  async function init() {
    if (user.status === "logged-out") {
      user.resetUser();
      return;
    }

    if (location.pathname === "/snippets") {
      if (user.username) {
        history.replace({
          pathname: `/users/${user.usernameLowerCase}`,
          search: "?type=local"
        });
        return;
      }
      setSnippetState({
        snippets: await fetchIDBSnippets(),
        user: { isLocal: true }
      });
      setDocumentTitle("Your Snippets");
    }
    else if (username) {
      if (username.toLowerCase() === user.usernameLowerCase) {
        initAuthUser();
      }
      else if (!user.loading) {
        initUser(username);
      }
    }
  }

  async function initAuthUser() {
    try {
      const data = await fetchSnippets(user._id);
      const newState = {
        snippets: data.snippets,
        user: { ...user, isLoggedIn: true }
      };

      if (data.message) {
        newState.notification = { value: data.message };
      }
      setSnippetState(newState);
      setDocumentTitle(`${user.username} Snippets`);
    } catch (e) {
      console.log(e);
      setState({ message: GENERIC_ERROR_MESSAGE });
    }
  }

  async function initUser(username) {
    try {
      const user = await fetchUser(username);

      if (user.code === 404) {
        setState({});
      }
      else if (user.code === 500) {
        setState({ message: GENERIC_ERROR_MESSAGE });
      }
      else {
        const data = await fetchServerSnippets(user._id);

        if (data.code === 500) {
          setState({ message: GENERIC_ERROR_MESSAGE });
        }
        else {
          const newState = {
            snippets: sortSnippets(data.snippets),
            user
          };

          if (data.message) {
            newState.notification = { value: data.message };
          }
          setSnippetState(newState);
          setDocumentTitle(`${user.username} Snippets`);
        }
      }
    } catch (e) {
      console.log(e);
      setState({ message: GENERIC_ERROR_MESSAGE });
    }
  }

  function showSnippetRemoveModal({ id, type }) {
    setState({ ...state, removeModal: { id, type }});
  }

  function hideSnippetRemoveModal() {
    delete state.removeModal;
    setState({ ...state });
  }

  async function removeSnippet() {
    const { id, type } = state.removeModal;
    const deleted = await deleteSnippet({ snippetId: id, type });

    delete state.removeModal;

    if (deleted) {
      const snippets = state.snippets.filter(snippet => snippet.id !== id);
      const tabSnippets = getTypeSnippets(snippets, state.visibleTabType);
      const tabs = updateSnippetTypeCount(snippets);
      const { page, offset } = getPageOffset();

      if (offset === tabSnippets.length && page > 1) {
        const search = new URLSearchParams(location.search);

        setState({ ...state, snippets, tabs });
        search.set("page", page - 1);
        history.replace({
          pathname: location.pathname,
          search: search.toString()
        });
        return;
      }
      setState({
        ...state,
        tabs,
        snippets,
        tabSnippets,
        pageSnippets: tabSnippets.slice(offset, offset + snippetsPerPage)
      });
    }
    else {
      state.notification = { value: "Snippet removal was unsuccessful." };
      setState({ ...state });
    }
  }

  async function toggleSnippetPrivacy(snippet) {
    const data = await updateServerSnippet({
      id: snippet.id,
      type: snippet.type === "private" ? "remote" : "private"
    });

    if (data.code === 200) {
      snippet.type = data.snippet.type;
      state.tabs = updateSnippetTypeCount(state.snippets);

      if (state.visibleTabType === "private") {
        showSnippets(state, state.visibleTabType);
        return;
      }
    }
    else if (data.code === 401) {
      state.notification = { value: SESSION_EXPIRATION_MESSAGE };
    }
    else {
      state.notification = { value: GENERIC_ERROR_MESSAGE };
    }
    setState({ ...state });
  }

  async function forkSnippet(snippet) {
    const data = await createServerSnippet(snippet, {
      isFork: true,
      userId: user._id
    });

    if (data.code === 201) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=forked"
      });
      return;
    }
    else if (data.code === 401) {
      state.notification = { value: SESSION_EXPIRATION_MESSAGE };
    }
    else {
      state.notification = { value: GENERIC_ERROR_MESSAGE };
    }
    setState({ ...state });
  }

  async function toggleSnippetFavoriteStatus(snippet) {
    const data = await favoriteSnippet(user.usernameLowerCase, {
      snippetUserName: state.user.usernameLowerCase,
      snippet
    });

    if (data.code === 200) {
      state.snippets = state.snippets.filter(({ id }) => data.snippet.id !== id);
      state.tabs = updateSnippetTypeCount(state.snippets);

      showSnippets(state, state.visibleTabType);
    }
    else if (data.code === 201) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=favorite"
      });
    }
    else {
      setState({
        ...state,
        notification: { value: data.message || GENERIC_ERROR_MESSAGE }
      });
    }
  }

  async function uploadSnippet(snippet) {
    const data = await createServerSnippet(snippet, {
      type: "private",
      userId: user._id
    });

    if (data.code === 201) {
      state.snippets.unshift(data.snippet);
      state.tabs = updateSnippetTypeCount(state.snippets);
      state.notification = {
        value: "Upload was successful.",
        type: "positive"
      };

      showSnippets(state, state.visibleTabType);
    }
    else if (data.code === 401) {
      setState({
        ...state,
        notification: { value: SESSION_EXPIRATION_MESSAGE }
      });
    }
    else {
      setState({
        ...state,
        notification: { value: GENERIC_ERROR_MESSAGE }
      });
    }
  }

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  function getSnippetLink(snippet) {
    if (snippet.type === "local") {
      return `/snippets/${snippet.id}`;
    }
    else if (snippet.type === "favorite") {
      return `/users/${snippet.username}/${snippet.id}`;
    }
    return `/users/${state.user.usernameLowerCase}/${snippet.id}${snippet.type === "gist" ? "?type=gist": ""}`;
  }

  function getPageOffset() {
    const page = parseInt(new URLSearchParams(location.search).get("page"), 10) || 1;

    return {
      page,
      offset: (page - 1) * snippetsPerPage
    };
  }

  function getTypeSnippets(snippets, type) {
    if (!type || type === "all") {
      return snippets;
    }
    else if (type === "remote") {
      return snippets.filter(snippet => (
        snippet.type === type ||
        snippet.type === "private" ||
        snippet.type === "forked"
      ));
    }
    else {
      return snippets.filter(snippet => snippet.type === type);
    }
  }

  function showSnippets(state, type) {
    const snippets = getTypeSnippets(state.snippets, type);
    const tabs = state.tabs || updateSnippetTypeCount(state.snippets);
    const { page, offset } = getPageOffset();

    if ((snippets.length && offset >= snippets.length) || (type && !tabs[type])) {
      setState({ ...state, message: NON_EXISTENT_PAGE_MESSAGE });
      return;
    }

    if (type === state.visibleTabType && page !== state.page) {
      window.scrollTo(0, 0);
    }
    setState({
      ...state,
      tabs,
      visibleTabType: type === "all" ? "" : type,
      tabSnippets: snippets,
      pageSnippets: snippets.slice(offset, offset + snippetsPerPage),
      hasMorePages: snippets.length > offset + snippetsPerPage,
      page
    });
  }

  function changeTab(type) {
    history.replace({
      pathname: location.pathname,
      search: type ? `?type=${type}` : ""
    });
  }

  function renderPageLinks() {
    const pathname = location.pathname;
    const searchNewer = new URLSearchParams(location.search);
    const searchOlder = new URLSearchParams(location.search);

    searchNewer.set("page", state.page - 1);
    searchOlder.set("page", state.page + 1);

    return (
      <div className="snippets-footer">
        {state.page > 1 ? (
          <Link to={`${pathname}?${searchNewer.toString()}`} className="btn">Newer</Link>
        ) : <button className="btn" disabled>Newer</button>}
        {state.hasMorePages ? (
          <Link to={`${pathname}?${searchOlder.toString()}`} className="btn">Older</Link>
        ) : <button className="btn" disabled>Older</button>}
      </div>
    );
  }

  function renderHeader() {
    const { user } = state;

    if (user.isLocal) {
      return (
        <div className="snippets-header">
          <h2 className="snippets-header-title">Your local snippets</h2>
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        </div>
      );
    }
    return (
      <div className="snippets-header">
        <UserProfileImage src={user.profileImage.path} size="64px" className="snippets-header-image" />
        <h2 className="snippets-header-title">{user.username}</h2>
      </div>
    );
  }

  function renderSnippetsTabs() {
    if (state.user.isLocal) {
      return null;
    }
    return (
      <ul className="snippet-tab-selection">
        {Object.keys(state.tabs).map((key, index) => {
          const tab = state.tabs[key];

          if (tab.require && !state.user.isLoggedIn) {
            return null;
          }
          else if (tab.type === "gist" && !state.user.isGithubConnected) {
            return null;
          }
          return (
            <li className="snippet-tab-selection-item" key={index}>
              <button className={`btn snippet-tab-selection-btn${state.visibleTabType === tab.type ? " active" : ""}`}
                onClick={() => changeTab(tab.type)}>
                {tab.iconName && <Icon name={tab.iconName} className="snippet-tab-selection-btn-icon"/>}
                <span>{tab.name}</span>
                <span className="snippet-tab-item-count">{tab.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  function renderSnippets() {
    const { user: snippetUser, tabSnippets, pageSnippets } = state;

    if (!tabSnippets.length) {
      return <p className="snippets-visible-snippet-message">{snippetUser.isLoggedIn ? "You don't" : "This user doesn't"} have any {state.visibleTabType} snippets.</p>;
    }
    return (
      <Fragment>
        <ul>
          {pageSnippets.map(snippet =>
            <SnippetPreview key={snippet.id} to={getSnippetLink(snippet)} snippet={snippet}>
              <SnippetDropdown snippet={snippet} snippetUser={snippetUser} authUser={user}
                uploadSnippet={uploadSnippet}
                removeSnippet={showSnippetRemoveModal}
                toggleSnippetPrivacy={toggleSnippetPrivacy}
                toggleSnippetFavoriteStatus={toggleSnippetFavoriteStatus}
                forkSnippet={forkSnippet}/>
            </SnippetPreview>
          )}
        </ul>
        {renderPageLinks()}
      </Fragment>
    );
  }

  function renderMessage() {
    const { user } = state;

    if (user.isLoggedIn || user.isLocal) {
      return (
        <div className="snippets-message-container">
          <h2>You don't have any {user.isLocal && "local "}snippets yet.</h2>
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        </div>
      );
    }
    return (
      <div className="snippets-message-container">
        <h2>This user doesn't have any snippets.</h2>
      </div>
    );
  }

  if (state.loading) {
    return <PageSpinner/>;
  }

  if (!state.user || state.message) {
    return <NoMatch message={state.message} />;
  }
  else if (state.snippets.length) {
    return (
      <div className="container snippets-container">
        {renderHeader()}
        {renderSnippetsTabs()}
        {state.notification && (
          <Notification className="snippets-notification"
            notification={state.notification}
            dismiss={hideNotification}/>
        )}
        {renderSnippets()}
        {state.removeModal ? (
          <SnippetRemoveModal
            type={state.removeModal.type}
            hide={hideSnippetRemoveModal}
            removeSnippet={removeSnippet}/>
        ) : null}
      </div>
    );
  }
  else if (state.user.isLocal) {
    return renderMessage();
  }
  return (
    <div className="container snippets-container">
      {renderHeader()}
      {renderMessage()}
    </div>
  );
}
