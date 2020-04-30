import { getResponse } from "../utils";

function fetchQuery(query, { tabName, page }) {
  return fetch(`/api/search?q=${query}&type=${tabName}&page=${page}`).then(getResponse);
}

export {
  fetchQuery
};
