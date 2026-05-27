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
  let res;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...options
    });
  } catch (error) {
    throw error;
  }

  return parseApiResponse(res);
};

export const getErrorMessage = (result, fallback = "Something went wrong.") => {
  if (!result) return fallback;
  return result.errors.join(", ") || result.message || fallback;
};

export const handleApiResult = (
  result,
  {
    baseurl,
    fallback = "Something went wrong.",
    onError,
    onForbidden,
    forbiddenMessage = "Access denied."
  } = {}
) => {
  if (result?.unauthorized && baseurl) {
    window.location.href = `${baseurl}/login.html`;
    return false;
  }

  if (result?.forbidden) {
    if (onForbidden) {
      onForbidden(result);
    } else if (onError) {
      onError(forbiddenMessage);
    }
    return false;
  }

  if (!result?.ok) {
    if (onError) {
      onError(getErrorMessage(result, fallback));
    }
    return false;
  }

  return true;
};
