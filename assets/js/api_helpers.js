export const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let body = null;
  let rawText = "";

  try {
    if (isJson) {
      body = await response.json();
    } else {
      rawText = await response.text();
    }
  } catch (_error) {}

  const errors =
    (Array.isArray(body?.errors) && body.errors) ||
    (typeof body?.error === "string" ? [body.error] : null) ||
    (rawText ? [rawText] : []) ||
    [];

  return {
    ok: response.ok,
    status: response.status,
    unauthorized: response.status === 401,
    forbidden: response.status === 403,
    items: Array.isArray(body?.items) ? body.items : [],
    item: body?.item ?? null,
    message: body?.message ?? "",
    errors,
    body,
    rawText
  };
};

export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options
  });

  return parseApiResponse(response);
};

export const getErrorMessage = (result, fallback = "Something went wrong.") => {
  if (!result) return fallback;
  return result.errors.join(", ") || result.message || fallback;
};

export const requireOk = (result, { baseurl } = {}) => {
  if (result.unauthorized && baseurl) {
    window.location.href = `${baseurl}/login.html`;
    return false;
  }

  if (!result.ok) {
    const error = new Error(getErrorMessage(result));
    error.result = result;
    throw error;
  }

  return true;
};
