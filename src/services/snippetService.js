import { fetchIDBSnippets, deleteIDBSnippet } from "./snippetIDBService";
import { fetchServerSnippets, deleteServerSnippet } from "./snippetServerService";

async function fetchSnippets(id) {
  const idbSnippets = await fetchIDBSnippets();
  const data = await fetchServerSnippets(id);

  if (data.code === 500) {
    return {
      code: data.code,
      snippets: sortSnippets(idbSnippets)
    };
  }
  return {
    snippets: sortSnippets(idbSnippets.concat(data.snippets))
  };
}

async function deleteSnippet(id, isLocal) {
  if (isLocal) {
    return deleteIDBSnippet(id);
  }
  else {
    const data = await deleteServerSnippet(id);

    return data.code === 200;
  }
}

function sortSnippets(snippets) {
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
}

export {
  fetchSnippets,
  deleteSnippet,
  sortSnippets
};
