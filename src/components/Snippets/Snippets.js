import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./snippets.scss";
import { setDocumentTitle, getRandomString } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippets } from "../../services/snippetIDBService";
import { fetchSnippets, deleteSnippet, sortSnippets } from "../../services/snippetService";
import { fetchServerSnippets, createServerSnippet, updateServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import Notification from "../Notification";
import SnippetInfo from "../SnippetInfo";
import Editor from "../Editor";
import NoMatch from "../NoMatch";
import UserProfileImage from "../UserProfileImage";
import SnippetDropdown from "./SnippetDropdown";
import SnippetRemoveModal from "./SnippetRemoveModal";

export default function Snippets(props) {
  const [state, setState] = useState({
    snippets: [],
    loading: true,
    user: null
  });
  const user = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, props.match.url]);

  useEffect(() => {
    if (state.notification && window.scrollY >= 100) {
      window.scrollTo(0, 0);
    }
  }, [state.notification]);

  function initSnippetState(state) {
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
      }
    };
    state.tabSnippets = state.snippets;
    state.visibleTabType = "";
    state.tabs = updateSnippetTypeCount(state.snippets, tabs);
    setState(state);
  }

  function updateSnippetTypeCount(snippets, tabs) {
    for (const snippet of snippets) {
      tabs.all = tabs.all || { name: "All", type: "", count: 0 };
      tabs.all.count += 1;

      if (snippet.type === "private" || snippet.type === "forked") {
        tabs.remote.count += 1;
      }
      tabs[snippet.type].count += 1;
    }
    return tabs;
  }

  async function init() {
    const { username } = props.match.params;

    if (user.status === "logged-out") {
      user.resetUser();
      return;
    }

    if (props.match.url === "/snippets") {
      initSnippetState({
        snippets: await fetchIDBSnippets(),
        user: { isLocal: true, ...user, isLoggedIn: !!user.username }
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
      initSnippetState(newState);
      setDocumentTitle(`${user.username} Snippets`);
    } catch (e) {
      console.log(e);
      setState({ message: "Something went wrong. Try again later." });
    }
  }

  async function initUser(username) {
    try {
      const user = await fetchUser(username);

      if (user.code === 404) {
        setState({});
      }
      else if (user.code === 500) {
        setState({ message: "Something went wrong. Try again later." });
      }
      else {
        const data = await fetchServerSnippets(user._id);

        if (data.code === 500) {
          setState({ message: "Something went wrong. Try again later." });
        }
        else {
          initSnippetState({ snippets: sortSnippets(data.snippets), user });
          setDocumentTitle(`${user.username} Snippets`);
        }
      }
    } catch (e) {
      console.log(e);
      setState({ message: "Something went wrong. Try again later." });
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
    if (state.notification) {
      hideNotification();
    }
    const { id, type } = state.removeModal;
    const deleted = await deleteSnippet({
      snippetId: id,
      type
    });

    if (deleted) {
      state.snippets = state.snippets.filter(snippet => snippet.id !== id);

      if (state.visibleTabType) {
        state.tabSnippets = state.snippets.filter(snippet => snippet.type === type);
      }
      state.tabs = updateSnippetTypeCount(state.snippets, state.tabs);
    }
    else {
      state.notification = { value: "Snippet removal was unsuccessful." };
    }
    delete state.removeModal;
    setState({ ...state });
  }

  async function toggleSnippetPrivacy(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const type = snippet.type === "private" ? "remote" : "private";
    const data = await updateServerSnippet({
      id: snippet.id,
      type
    });

    if (data.code === 200) {
      snippet.type = type;

      if (state.visibleTabType === "private") {
        state.tabSnippets = state.tabSnippets.filter(({ id }) => snippet.id !== id);
      }
      state.tabs = updateSnippetTypeCount(state.snippets, state.tabs);
    }
    else if (data.code === 401) {
      state.notification = { value: "Seems like your session has expired. Relogin and try again." };
    }
    else {
      state.notification = { value: "Something went wrong. Try again later." };
    }
    setState({ ...state });
  }

  async function forkSnippet(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const id = getRandomString();
    const data = await createServerSnippet({
      ...snippet,
      files: snippet.files.map(file => {
        file.id = getRandomString();
        return file;
      }),
      userId: user._id,
      created: new Date(),
      id,
      type: "forked",
      fork: {
        id: snippet.id,
        userId: snippet.userId,
        username: state.user.username,
        usernameLowerCase: state.user.usernameLowerCase
      }
    });

    if (data.code === 200) {
      props.history.push({
        pathname:`/users/${user.usernameLowerCase}/${data.id ? data.id : id}`
      });
    }
    else if (data.code === 401) {
      state.notification = { value: "Seems like your session has expired. Relogin and try again." };
      setState({ ...state });
    }
    else {
      state.notification = { value: "Something went wrong. Try again later." };
      setState({ ...state });
    }
  }

  async function uploadSnippet(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const remoteSnippet = {
      ...snippet,
      userId: user._id,
      type: "private",
      created: new Date(),
      id: getRandomString(),
      files: snippet.files.map(file => {
        file.id = getRandomString();
        return file;
      })
    };
    const data = await createServerSnippet(remoteSnippet);

    if (data.code === 200) {
      state.snippets.unshift(remoteSnippet);
      state.tabs = updateSnippetTypeCount(state.snippets, state.tabs);
      state.notification = {
        value: "Upload was successful.",
        type: "positive"
      };
    }
    else if (data.code === 401) {
      state.notification = { value: "Seems like your session has expired. Relogin and try again." };
    }
    else {
      state.notification = { value: "Something went wrong. Try again later." };
    }
    setState({ ...state });
  }

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  function showSnippets(type) {
    if (type === state.visibleTabType) {
      return;
    }
    let snippets = [];

    if (!type) {
      snippets = state.snippets;
    }
    else if (type === "remote") {
      snippets = state.snippets.filter(snippet => (
        snippet.type === type ||
        snippet.type === "private" ||
        snippet.type === "forked"
      ));
    }
    else {
      snippets = state.snippets.filter(snippet => snippet.type === type);
    }
    setState({
      ...state,
      visibleTabType: type,
      tabSnippets: snippets
    });
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
                onClick={() => showSnippets(tab.type)}>
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
    const { user: snippetUser, tabSnippets } = state;

    if (!tabSnippets.length) {
      return <p className="snippets-visible-snippet-message">{state.user.isLoggedIn ? "You don't" : "This user doesn't"} have any {state.visibleTabType} snippets.</p>;
    }
    return (
      <ul>
        {tabSnippets.map(snippet => (
          <li className="snippet" key={snippet.id}>
            <div className="snippet-top">
              <SnippetInfo snippet={snippet}/>
              {snippetUser.isLocal || snippetUser.username === user.username ? (
                <SnippetDropdown user={snippetUser} snippet={snippet}
                  uploadSnippet={uploadSnippet}
                  removeSnippet={showSnippetRemoveModal}
                  toggleSnippetPrivacy={toggleSnippetPrivacy} />
              ) : (user.username ? (
                <button className="btn icon-text-btn snippet-fork-btn" onClick={() => forkSnippet(snippet)}>
                  <Icon name="fork" />
                  <span>Fork</span>
                </button>
              ) : null)}
            </div>
            <Link to={snippet.type === "local" ? `/snippets/${snippet.id}` : `/users/${snippetUser.usernameLowerCase}/${snippet.id}${snippet.type === "gist" ? "?type=gist": ""}`} className="snippet-link">
              <Editor file={snippet.files[0]} settings={snippet.settings}
                height={snippet.files[0].height} readOnly preview />
            </Link>
          </li>
        ))}
      </ul>
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
      <div className="snippets-container">
        {renderHeader()}
        {renderSnippetsTabs()}
        {state.notification && (
          <Notification className="snippets-notification"
            value={state.notification.value}
            type={state.notification.type}
            dismiss={hideNotification}/>
        )}
        {renderSnippets()}
        {state.removeModal ? <SnippetRemoveModal type={state.removeModal.type} hide={hideSnippetRemoveModal} removeSnippet={removeSnippet} /> : null}
      </div>
    );
  }
  else if (state.user.isLocal) {
    return renderMessage();
  }
  return (
    <div className="snippets-container">
      {renderHeader()}
      {renderMessage()}
    </div>
  );
}
