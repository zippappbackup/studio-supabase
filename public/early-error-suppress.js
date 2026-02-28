// --- early-error-suppress.js ---
// Load this before Next.js to suppress "Timeout" or Firebase rejections.

(function () {
  const origAddEventListener = window.addEventListener;
  const earlyQueue = [];

  // Temporarily hijack event listener registration until Next.js is ready
  window.addEventListener = function (type, listener, opts) {
    if (type === "unhandledrejection") {
      earlyQueue.push(listener);
      return;
    }
    return origAddEventListener.call(this, type, listener, opts);
  };

  // Our suppression handler — runs before Next.js handlers attach
  origAddEventListener.call(window, "unhandledrejection", (event) => {
    const reason =
      (event.reason && event.reason.message) || event.reason || "";
    if (typeof reason === "string" && reason.toLowerCase().includes("timeout")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("[Suppressed early Timeout rejection]");
      return false;
    }
  });

  // After page fully loads, reattach hijacked handlers
  window.addEventListener("load", () => {
    earlyQueue.forEach((listener) => {
      origAddEventListener.call(window, "unhandledrejection", listener);
    });
  });
})();
