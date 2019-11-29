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
  const data = {
    snippets: sortSnippets(idbSnippets.concat(response.snippets))
  };

  if (response.snippetError) {
    data.message = "Could not retrieve snippets.";
  }
  else if (response.gistError) {
    data.message = "Could not retrieve gists.";
  }
  return data;
}

async function deleteSnippet({ snippetId, type }) {
  if (type === "local") {
    return deleteIDBSnippet(snippetId);
  }
  else {
    const data = await deleteServerSnippet({ snippetId, type });

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
