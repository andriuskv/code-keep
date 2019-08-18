import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./snippets.scss";
import { setDocumentTitle } from "../../utils";
import { saveSnippet, fetchSnippets, deleteSnippet } from "../../services/db";
import Icon from "../Icon";
import Editor from "../Editor";
import DateDiff from "../DateDiff";

export default function Snippets(props) {
  const [snippets, setSnippets] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function init() {
    const snippets = await fetchSnippets();
    const snippet = props.location.state;

    if (snippet) {
      const index = snippets.findIndex(({ id }) => snippet.id === id);

      if (index >= 0) {
        snippets.splice(index, 1, snippet);
      }
      else {
        snippets.unshift(snippet);
      }
      setSnippets([...snippets]);
      saveSnippet(snippet);
    }
    else {
      setSnippets(snippets);
    }
    setLoaded(true);
    setDocumentTitle("Your Snippets");
  }

  function editSnippet(id) {
    props.history.push({
      pathname: `/snippets/${id}/edit`
    });
  }

  function removeSnippet(index) {
    deleteSnippet(snippets[index].id);
    snippets.splice(index, 1);
    setSnippets([...snippets]);
  }

  function handleLoad(snippet, { height }) {
    const [file] = snippet.files;

    if (file.height !== height) {
      file.height = height;
      setSnippets([...snippets]);
      saveSnippet(snippet);
    }
  }

  if (!loaded) {
    return null;
  }
  else if (loaded && !snippets.length) {
    return (
      <div className="snippets-message-container">
        <h2>You don't have any snippets yet.</h2>
        <Link to="/snippets/create" className="btn btn-secondary">Create New Snippet</Link>
      </div>
    );
  }
  return (
    <Fragment>
      <div className="snippets-header">
        <h2 className="snippets-header-title">Your Snippets</h2>
        <Link to="/snippets/create" className="btn btn-secondary">Create New Snippet</Link>
      </div>
      <ul className="snippets">
        {snippets.map((snippet, index) => {
          return (
            <li className="snippet" key={snippet.id}>
              <h3 className="snippet-title">{snippet.title}</h3>
              {snippet.description && (
                <p className="snippet-description">{snippet.description}</p>
              )}
              <div className="snippet-info">
                <span className="snippet-info-item">{snippet.files.length} {`File${snippet.files.length > 1 ? "s" : ""}`}</span>
                <span><DateDiff start={snippet.created} /></span>
              </div>
              <Link to={`/snippets/${snippet.id}`} className="snippet-link">
                <Editor file={snippet.files[0]} settings={snippet.settings}
                  height={snippet.files[0].height} readOnly handleLoad={data => handleLoad(snippet, data)} />
              </Link>
              <div className="snippet-footer">
                <button className="btn icon-text-btn" onClick={() => editSnippet(snippet.id)}>
                  <Icon name="edit" />
                  <span>Edit</span>
                </button>
                <button className="btn icon-text-btn danger-btn snippet-remove-btn" onClick={() => removeSnippet(index)}>
                  <Icon name="trash" />
                  <span>Remove</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Fragment>
  );
}
