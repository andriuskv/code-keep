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

async function deleteSnippet({ snippetId, type }) {
  if (type === "local") {
    return deleteIDBSnippet(snippetId);
  }
  else {
    const status = await deleteServerSnippet({ snippetId, type });

    return status === 204;
  }
}

function sortSnippets(snippets) {
  return snippets.sort((a, b) => {
    if (a.created < b.created) {
      return 1;
    }
    else if (a.created > b.created) {
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
