import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import "./local-snippets.scss";
import { GENERIC_ERROR_MESSAGE } from "../../messages";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import { fetchIDBSnippets, deleteIDBSnippet } from "../../services/snippetIDBService";
import Notification from "../Notification";
import NoMatch from "../NoMatch";
import SnippetDropdown from "../SnippetDropdown";
import SnippetPreview from "../SnippetPreview";
import SnippetRemoveModal from "../SnippetRemoveModal";

export default function LocalSnippets() {
  const history = useHistory();
  const authUser = useUser();
  const [state, setState] = useState(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  async function init() {
    if (authUser.loading) {
      return;
    }
    else if (authUser.username) {
      history.replace({
        pathname: `/users/${authUser.usernameLowerCase}`,
        search: "?type=local"
      });
      return;
    }
    try {
      setState({ snippets: await fetchIDBSnippets() });
      setDocumentTitle("Your Snippets");
    } catch (e) {
      console.log(e);
      setState({ message: GENERIC_ERROR_MESSAGE });
    }
  }

  async function removeSnippet() {
    const id = state.snippetToRemove;
    const deleted = await deleteIDBSnippet(state.snippetToRemove);

    delete state.snippetToRemove;

    if (deleted) {
      const snippets = state.snippets.filter(snippet => snippet.id !== id);

      setState({ ...state, snippets });
    }
    else {
      state.notification = { value: "Snippet removal was unsuccessful." };
      setState({ ...state });
    }
  }

  function showSnippetRemoveModal({ id }) {
    setState({ ...state, snippetToRemove: id });
  }

  function hideSnippetRemoveModal() {
    delete state.snippetToRemove;
    setState({ ...state });
  }

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  function renderHeader() {
    return (
      <div className="local-snippets-header">
        <h2 className="local-snippets-header-title">Your local snippets</h2>
        <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
      </div>
    );
  }

  if (!state) {
    return null;
  }
  else if (state.message) {
    return <NoMatch message={state.message}/>;
  }
  else if (state.snippets.length) {
    return (
      <div className="container local-snippets-container">
        {renderHeader()}
        {state.notification && (
          <Notification margin="bottom"
            notification={state.notification}
            dismiss={hideNotification}/>
        )}
        <ul>
          {state.snippets.map(snippet =>
            <SnippetPreview key={snippet.id} to={`/snippets/${snippet.id}`} snippet={snippet}>
              <SnippetDropdown snippet={snippet}
                snippetUser={{ isLocal: true }}
                authUser={authUser}
                removeSnippet={showSnippetRemoveModal}/>
            </SnippetPreview>
          )}
        </ul>
        {state.snippetToRemove ? (
          <SnippetRemoveModal
            hide={hideSnippetRemoveModal}
            removeSnippet={removeSnippet}/>
        ) : null}
      </div>
    );
  }
  return (
    <div className="container local-snippets-container">
      <div className="local-snippets-message-container">
        <h2>You don't have any local snippets yet.</h2>
        <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
      </div>
    </div>
  );
}
