import React from "react";
import { confirmLeave } from "../layout/navGuard";

/** Hash link that asks before leaving the layout editor with unsaved changes. */
const AppLink = ({ href, children, ...props }) => (
  <a
    href={href}
    onClick={(event) => {
      if (!confirmLeave()) event.preventDefault();
    }}
    {...props}
  >
    {children}
  </a>
);

export default AppLink;
