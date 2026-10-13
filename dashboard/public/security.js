(() => {
  const csrfScript = document.currentScript;
  const csrfToken = csrfScript?.dataset.csrfToken;
  if (!csrfToken) return;

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || ["GET", "DIALOG"].includes(form.method.toUpperCase())) return;

    let action;
    try { action = new URL(form.action, window.location.href); } catch { return; }
    if (action.origin !== window.location.origin) return;

    let tokenInput = form.querySelector('input[name="_csrf"]');
    if (!tokenInput) {
      tokenInput = document.createElement("input");
      tokenInput.type = "hidden";
      tokenInput.name = "_csrf";
      form.appendChild(tokenInput);
    }
    tokenInput.value = csrfToken;
  });

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const request = input instanceof Request ? input : null;
    let target;
    try { target = new URL(request ? request.url : input, window.location.href); } catch { return originalFetch(input, options); }

    const method = String(options.method || request?.method || "GET").toUpperCase();
    if (target.origin !== window.location.origin || ["GET", "HEAD", "OPTIONS"].includes(method)) {
      return originalFetch(input, options);
    }

    const headers = new Headers(request?.headers || undefined);
    new Headers(options.headers || undefined).forEach((value, name) => headers.set(name, value));
    headers.set("x-csrf-token", csrfToken);
    return originalFetch(input, { ...options, headers });
  };
})();
