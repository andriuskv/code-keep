import { Store, set, get, keys, del } from "idb-keyval";

const store = new Store("code-keep", "snippets");

function fetchSnippets() {
  return keys(store).then(keys => Promise.all(keys.map(fetchSnippet)))
    .then(snippets => {
      return snippets.sort((a, b) => {
        const aDate = new Date(a.created);
        const bDate = new Date(b.created);

        if (aDate < bDate) {
          return 1;
        }

        if (aDate > bDate) {
          return -1;
        }
        return 0;
      });
    });
}

function fetchSnippet(id) {
  return get(id, store);
}

function saveSnippet(snippet) {
  set(snippet.id, snippet, store);
}

function deleteSnippet(id) {
  del(id, store);
}

export {
  saveSnippet,
  fetchSnippets,
  fetchSnippet,
  deleteSnippet
};
