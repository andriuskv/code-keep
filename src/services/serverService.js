function fetchQuery(query) {
  return fetch(`/search?q=${query}`).then(getResponse);
}

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}

export {
  fetchQuery
};
