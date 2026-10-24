// Tracks unsaved layout edits so navigation can ask before discarding them.
let dirty = false;

export const setDirty = (value) => {
  dirty = value;
};

export const confirmLeave = () =>
  !dirty || window.confirm("You have unsaved layout changes. Leave without saving?");
