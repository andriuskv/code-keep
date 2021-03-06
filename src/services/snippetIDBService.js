import { createStore, set, get, keys, del } from "idb-keyval";

const store = createStore("code-keep", "snippets");

function fetchIDBSnippets() {
  return keys(store).then(keys => Promise.all(keys.map(fetchIDBSnippet)))
    .catch(e => {
      console.log(e);
      return [];
    });
}

function fetchIDBSnippet(id) {
  return get(id, store);
}

function saveSnippet(snippet) {
  set(snippet.id, snippet, store);
}

function deleteIDBSnippet(id) {
  return del(id, store).then(() => true);
}

export {
  fetchIDBSnippets,
  fetchIDBSnippet,
  saveSnippet,
  deleteIDBSnippet
};
