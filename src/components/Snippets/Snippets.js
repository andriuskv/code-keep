import { useState, useEffect, Fragment } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "./snippets.scss";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE, NON_EXISTENT_PAGE_MESSAGE } from "../../messages";
import { setDocumentTitle } from "../../utils";
import { fetchUser, favoriteSnippet } from "../../services/userService";
import { fetchSnippets, deleteSnippet, sortSnippets } from "../../services/snippetService";
import { fetchServerSnippets, createServerSnippet, patchServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Skeleton from "./SnippetsSkeleton";
import Icon from "../Icon";
import Notification from "../Notification";
import SnippetPreview from "../SnippetPreview";
import NoMatch from "../NoMatch";
import UserProfileImage from "../UserProfileImage";
import SnippetDropdown from "../SnippetDropdown";
import SnippetRemoveModal from "../SnippetRemoveModal";

export default function Snippets() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useParams();
  const [state, setState] = useState({
    snippets: [],
    loading: true
  });
  const [user, setUser] = useState(null);
  const authUser = useUser();
  const snippetsPerPage = 10;

  useEffect(() => {
    // Reset data then navigating from one user to another.
    if (!state.loading) {
      window.scrollTo(0, 0);
      setState({
        snippets: [],
        loading: true
      });

      if (user) {
        setUser(null);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, location.pathname]);

  useEffect(() => {
    if (user?.usernameLowerCase === username.toLowerCase()) {
      setSnippetState(state, user.usernameLowerCase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (state.notification && window.scrollY >= 100) {
      window.scrollTo(0, 0);
    }
  }, [state.notification]);

  function setSnippetState(state, username) {
    const type = new URLSearchParams(location.search).get("type") || "";

    if (username !== authUser.usernameLowerCase) {
      const allowedTypes = ["all", "forked", "favorite"];

      if (type && !allowedTypes.includes(type)) {
        setState({ ...state, message: NON_EXISTENT_PAGE_MESSAGE });
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
      public: {
        name: "Public",
        type: "public",
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

      if (snippet.type === "forked") {
        tabs.public.count += 1;
      }
      tabs[snippet.type].count += 1;
    }
    return tabs;
  }

  async function init() {
    if (authUser.status === "logged-out") {
      authUser.resetUser();
      return;
    }

    if (username.toLowerCase() === authUser.usernameLowerCase) {
      initAuthUser();
    }
    else if (!authUser.loading) {
      initUser(username);
    }
  }

  async function initAuthUser() {
    setUser({ ...authUser, isLoggedIn: true });

    try {
      const data = await fetchSnippets(authUser._id);
      const newState = { snippets: data.snippets };

      if (data.message) {
        newState.notification = { value: data.message };
      }
      setSnippetState(newState, authUser.usernameLowerCase);
      setDocumentTitle(`${authUser.username} Snippets`);
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
        setUser({ ...user, isLoggedIn: authUser.role === "admin" });

        const data = await fetchServerSnippets(user._id);

        if (data.code === 500) {
          setState({ message: GENERIC_ERROR_MESSAGE });
        }
        else {
          const newState = { snippets: sortSnippets(data.snippets) };

          if (data.message) {
            newState.notification = { value: data.message };
          }
          setSnippetState(newState, user.usernameLowerCase);
          setDocumentTitle(`${user.username} Snippets`);
        }
      }
    } catch (e) {
      console.log(e);
      setState({ message: GENERIC_ERROR_MESSAGE });
    }
  }

  function showSnippetRemoveModal({ id, type, username }) {
    setState({ ...state, removeModal: { id, type, username }});
  }

  function hideSnippetRemoveModal() {
    delete state.removeModal;
    setState({ ...state });
  }

  async function removeSnippet() {
    const { id, type, username } = state.removeModal;
    const deleted = await deleteSnippet({ snippetId: id, type, username });

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
        navigate({
          pathname: location.pathname,
          search: search.toString()
        }, { replace: true });
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

  async function toggleSnippetPrivacy({ id, type, username }) {
    const data = await patchServerSnippet({
      id,
      type: type === "private" ? "public" : "private",
      username
    });

    if (data.code === 200) {
      const snipppet = state.snippets.find(snippet => id === snippet.id);
      snipppet.type = data.snippet.type;
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
      userId: authUser._id
    });

    if (data.code === 201) {
      navigate({
        pathname: `/users/${authUser.usernameLowerCase}`,
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
    const data = await favoriteSnippet(authUser.usernameLowerCase, {
      snippetUserName: user.usernameLowerCase,
      snippet
    });

    if (data.code === 200) {
      state.snippets = state.snippets.filter(({ id }) => data.snippet.id !== id);
      state.tabs = updateSnippetTypeCount(state.snippets);

      showSnippets(state, state.visibleTabType);
    }
    else if (data.code === 201) {
      navigate({
        pathname: `/users/${authUser.usernameLowerCase}`,
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
      userId: authUser._id
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
    return `/users/${user.usernameLowerCase}/${snippet.id}${snippet.type === "gist" ? "?type=gist": ""}`;
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
    else if (type === "public") {
      return snippets.filter(snippet => (
        snippet.type === type ||
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
    navigate({
      pathname: location.pathname,
      search: type ? `?type=${type}` : ""
    }, { replace: true });
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
    return (
      <div className="snippets-header">
        <UserProfileImage src={user.profileImage.path} size="64px" className="snippets-header-image"/>
        <h2 className="snippets-header-title">{user.username}</h2>
      </div>
    );
  }

  function renderSnippetsTabs() {
    return (
      <ul className="snippet-tab-selection">
        {Object.keys(state.tabs).map((key, index) => {
          const tab = state.tabs[key];

          if (tab.require && !user.isLoggedIn) {
            return null;
          }
          else if (tab.type === "gist" && !user.isGithubConnected) {
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
    const { tabSnippets, pageSnippets } = state;

    if (!tabSnippets.length) {
      const type = state.visibleTabType;
      const pass = user.isLoggedIn && type !== "forked" && type !== "favorite";
      const style = pass ? {} : { marginBottom: "50px" };

      return (
        <div className="snippets-message-container">
          <p style={style}>{user.isLoggedIn ? "You don't" : "This user doesn't"} have any {type} snippets.</p>
          {pass && <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>}
        </div>
      );
    }
    return (
      <Fragment>
        <ul>
          {pageSnippets.map(snippet =>
            <SnippetPreview key={snippet.id} to={getSnippetLink(snippet)} snippet={snippet} snippetUser={user} authUser={authUser}>
              <SnippetDropdown snippet={snippet} snippetUser={user} authUser={authUser}
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

  if (state.loading) {
    return (
      <div className="container snippets-container">
        <Skeleton/>
      </div>
    );
  }
  else if (!user || state.message) {
    return <NoMatch message={state.message}/>;
  }
  return (
    <div className="container snippets-container">
      {renderHeader()}
      {renderSnippetsTabs()}
      {state.notification && (
        <Notification margin="bottom"
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
