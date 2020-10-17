import { v4 as uuidv4 } from "uuid";
import { getResponse } from "../utils";

function fetchServerSnippets(userId) {
  return fetch(`/api/snippets/${userId}`)
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
  return fetch(`/api/snippets/${username}/${snippetId}${status === "edit" ? "/edit" : ""}${queryParams}`).then(getResponse);
}

function fetchServerRecentSnippets(page) {
  return fetch(`/api/snippets?page=${page}`).then(getResponse);
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
  return fetch("/api/snippets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...snippet,
      type,
      userId,
      id: uuidv4(),
      createdAt: Date.now(),
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
  return fetch(`/api/snippets/${snippet.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(getResponse);
}

function patchServerSnippet(snippet) {
  return fetch(`/api/snippets/${snippet.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(getResponse);
}

function deleteServerSnippet({ snippetId, type }) {
  return fetch(`/api/snippets/${snippetId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ type })
  }).then(res => res.status);
}

export {
  fetchServerSnippets,
  fetchServerSnippet,
  fetchServerRecentSnippets,
  createServerSnippet,
  updateServerSnippet,
  patchServerSnippet,
  deleteServerSnippet
};
