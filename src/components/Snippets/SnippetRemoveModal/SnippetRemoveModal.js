import React from "react";
import "./snippet-remove-modal.scss";
import Icon from "../../Icon";

export default function Settings({ hide, removeSnippet }) {
  function handleModalClick(event) {
    if (event.target === event.currentTarget) {
      hide();
    }
  }

  return (
    <div className="snippet-remove-modal" onClick={handleModalClick}>
      <div className="snippet-remove-modal-content">
        <div className="snippet-remove-modal-title-container">
          <Icon name="trash" className="snippet-remove-modal-title-icon" />
          <h3 className="snippet-remove-modal-title">Remove Snippet?</h3>
        </div>
        <p>Are you sure you want to remove this snippet? <b>This action is irreversible.</b></p>
        <div className="snippet-remove-modal-content-bottom">
          <button className="btn text-btn" onClick={hide}>Cancel</button>
          <button className="btn icon-text-btn danger-btn" onClick={removeSnippet}>
            <Icon name="trash" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}