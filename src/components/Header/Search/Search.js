import React from "react";
import { useHistory } from "react-router-dom";
import "./search.scss";
import Icon from "../../Icon";

export default function Search() {
  const history = useHistory();

  function handleInput(event) {
    if (event.key === "Enter" && event.target.value) {
      history.push({
        pathname: "/search",
        search: `?q=${event.target.value}`
      });
    }
  }
  return (
    <div className="header-search-input-container">
      <Icon name="search" className="header-search-input-icon"/>
      <input type="text" className="input header-search-input"
        placeholder="Search" onKeyPress={handleInput}/>
    </div>
  );
}
