import React, { Fragment } from "react";
import "./snippets-skeleton.scss";

function Skeleton() {
  return (
    <Fragment>
      <div className="snippets-skeleton-header">
        <div className="snippets-skeleton-header-image"></div>
        <div className="snippets-skeleton-header-title"></div>
      </div>
      <div className="snippets-skeleton-tabs">
        <div className="snippets-skeleton-tab snippets-skeleton-tab-1"></div>
        <div className="snippets-skeleton-tab snippets-skeleton-tab-2"></div>
        <div className="snippets-skeleton-tab snippets-skeleton-tab-3"></div>
      </div>
      <ul>{Array.from(new Array(4), (_, i) => (
        <li key={i} className="snippet-skeleton-preview">
          <div className="snippet-skeleton-preview-top">
            <div className="snippet-skeleton-preview-top-item snippet-skeleton-preview-top-item-1"></div>
            <div className="snippet-skeleton-preview-top-item snippet-skeleton-preview-top-item-2"></div>
            <div className="snippet-skeleton-preview-top-item snippet-skeleton-preview-top-item-3"></div>
          </div>
          {Math.random() > 0.8 && <div className="snippet-skeleton-desc"></div>}
          <div className="snippet-skeleton-info"></div>
          <div className="snippet-skeleton-editor">
            {Array.from(new Array(Math.floor(Math.random() * 7) + 1), (_, i) => (
              <div key={i} className={`snippet-skeleton-editor-line snippet-skeleton-editor-line-${i + 1}`} style={{ width: `${Math.floor(Math.random() * 528) + 72}px`}}></div>
            ))}
          </div>
        </li>
      ))}</ul>
    </Fragment>
  );
}

export default React.memo(Skeleton);
