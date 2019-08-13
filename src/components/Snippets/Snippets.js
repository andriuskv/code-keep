import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./snippets.scss";
import { setDocumentTitle } from "../../utils";
import Icon from "../Icon";
import Editor from "../Editor";
import DateDiff from "../DateDiff";

export default function Snippets(props) {
  const [snippets, setSnippets] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const newSnippet = props.location.state;
    const snippets = JSON.parse(localStorage.getItem("snippets")) || [];

    if (newSnippet) {
      const index = snippets.findIndex(snippet => newSnippet.id === snippet.id);

      if (index >= 0) {
        snippets.splice(index, 1, newSnippet);
      }
      else {
        snippets.push(newSnippet);
      }
      setSnippets([...snippets]);
      localStorage.setItem("snippets", JSON.stringify(snippets));
    }
    else {
      setSnippets(snippets);
    }
    setLoaded(true);
    setDocumentTitle("Your Snippets");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editSnippet(id) {
    props.history.push({
      pathname: `/snippets/${id}/edit`
    });
  }

  function removeSnippet(index) {
    snippets.splice(index, 1);
    setSnippets([...snippets]);

    const snippetsToSave = snippets.map(oldSnippet => {
      const snippet = { ...oldSnippet };

      delete snippet.loaded;
      return snippet;
    });
    localStorage.setItem("snippets", JSON.stringify(snippetsToSave));
  }

  function handleLoad(index) {
    snippets[index].loaded = true;
    setSnippets([...snippets]);
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
            <li className={`snippet${snippet.loaded ? " loaded" : ""}`} key={snippet.id}>
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
                  readOnly preview handleLoad={() => handleLoad(index)} />
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
