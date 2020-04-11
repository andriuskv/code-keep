import { v4 as uuidv4 } from "uuid";

function fetchServerSnippets(userId) {
  return fetch(`/snippets/${userId}`)
    .then(getResponse)
    .then(data => {
      if (data.snippetError) {
        data.message = "Could not retrieve snippets.";
      }
      else if (data.gistError) {
        data.message = "Could not retrieve gist snippets.";
      }
      else if (data.favoriteError) {
        data.message = "Could not retrieve favorite snippets.";
      }
      return data;
    });
}

function fetchServerSnippet({ snippetId, username, status, queryParams }) {
  return fetch(`/snippets/${username}/${snippetId}${status === "edit" ? "/edit" : ""}${queryParams}`).then(getResponse);
}

function fetchServerRecentSnippets(page) {
  return fetch(`/snippets?page=${page}`).then(getResponse);
}

function createServerSnippet(snippet, { isFork = false, type = snippet.type, userId = "" } = {}) {
  let fork = undefined;

  if (isFork) {
    type = "forked";
    fork = {
      id: snippet.id,
      userId: snippet.userId
    };
  }
  return fetch("/snippets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...snippet,
      type,
      userId,
      id: uuidv4(),
      created: new Date(),
      fork,
      files: snippet.files.map(file => ({
        id: uuidv4(),
        name: file.name,
        type: file.type,
        value: file.value
      }))
    })
  }).then(getResponse);
}

function updateServerSnippet(snippet) {
  return fetch(`/snippets/${snippet.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(getResponse);
}

function deleteServerSnippet({ snippetId, type }) {
  return fetch(`/snippets/${snippetId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ type })
  }).then(res => res.status);
}

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}

export {
  fetchServerSnippets,
  fetchServerSnippet,
  fetchServerRecentSnippets,
  createServerSnippet,
  updateServerSnippet,
  deleteServerSnippet
};
