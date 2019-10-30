import React, { Fragment } from "react";
import "./submit-dropdown.scss";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";
import spinner from "../../../assets/ring.svg";

export default function SubmitDropdown({submitButtonDisaled, username, handleSubmit}) {
  return (
    <Dropdown
      toggle={{ content: "Create Snippet", className: "btn form-submit-dropdown-toggle-btn" }}
      body={{ className: "form-submit-dropdown" }}>
      <button className="btn icon-text-btn dropdown-btn form-submit-btn"
        disabled={submitButtonDisaled}
        onClick={() => handleSubmit("local")}>
        <Icon name="home" />
        <span>Create Local</span>
        {submitButtonDisaled && (
          <img src={spinner} className="form-submit-btn-spinner" alt="" />
        )}
      </button>
      {username ? (
        <Fragment>
          <button className="btn icon-text-btn dropdown-btn form-submit-btn"
            disabled={submitButtonDisaled}
            onClick={() => handleSubmit("private")}>
            <Icon name="locked" />
            <span>Create Private</span>
            {submitButtonDisaled && (
              <img src={spinner} className="form-submit-btn-spinner" alt="" />
            )}
          </button>
          <button className="btn dropdown-btn form-submit-btn" disabled={submitButtonDisaled}
            onClick={() => handleSubmit("remote")}>
            <span>Create Remote</span>
            {submitButtonDisaled && (
              <img src={spinner} className="form-submit-btn-spinner" alt="" />
            )}
          </button>
        </Fragment>) : null}
    </Dropdown>
  );
}
