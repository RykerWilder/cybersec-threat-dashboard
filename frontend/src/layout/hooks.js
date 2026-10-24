import { useSyncExternalStore } from "react";

const subscribeHash = (callback) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

/** "layout" for #/layout, otherwise "dashboard". */
export function useRoute() {
  return useSyncExternalStore(
    subscribeHash,
    () => (window.location.hash.startsWith("#/layout") ? "layout" : "dashboard"),
    () => "dashboard"
  );
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
