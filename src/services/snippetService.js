import { fetchIDBSnippets, deleteIDBSnippet } from "./snippetIDBService";
import { fetchServerSnippets, deleteServerSnippet } from "./snippetServerService";

async function fetchSnippets(id) {
  const [idbSnippets, response] = await Promise.all([fetchIDBSnippets(), fetchServerSnippets(id)]);

  if (response.code === 500) {
    return {
      message: "Could not retrieve snippets.",
      snippets: sortSnippets(idbSnippets)
    };
  }
  return {
    code: response.code,
    snippets: sortSnippets(idbSnippets.concat(response.snippets)),
    message: response.message
  };
}

async function deleteSnippet({ snippetId, type, username }) {
  if (type === "local") {
    return deleteIDBSnippet(snippetId);
  }
  else {
    const status = await deleteServerSnippet({ snippetId, type, username });

    return status === 204;
  }
}

function sortSnippets(snippets) {
  return snippets.sort((a, b) => {
    const dateA = Math.max(a.createdAt, a.modifiedAt || 0);
    const dateB = Math.max(b.createdAt, b.modifiedAt || 0);

    if (dateA < dateB) {
      return 1;
    }
    else if (dateA > dateB) {
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
