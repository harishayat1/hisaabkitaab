if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function(err) {
    console.log("SW registration failed (may be file:// protocol):", err);
  });
}
