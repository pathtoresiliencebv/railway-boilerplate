import React from "react"

const MenuCleanerCSS = () => {
  return (
    <style>
      {`
        /* Hide Documentation and Changelog menu items */
        [data-testid*="documentation"],
        [href*="documentation"],
        a[href*="docs"],
        [data-testid*="changelog"],
        [href*="changelog"],
        a[href*="changelog"] {
          display: none !important;
        }

        /* Hide menu items by text content */
        li:has-text("Documentation"),
        div[role="menuitem"]:has-text("Documentation"),
        li:has-text("Changelog"),
        div[role="menuitem"]:has-text("Changelog") {
          display: none !important;
        }

        /* Alternative approach for menu items */
        [role="menu"] li:contains("Documentation"),
        [role="menu"] li:contains("Changelog"),
        [role="menubar"] li:contains("Documentation"),
        [role="menubar"] li:contains("Changelog") {
          display: none !important;
        }
      `}
    </style>
  )
}

MenuCleanerCSS.zone = "profile-menu"

export default MenuCleanerCSS
