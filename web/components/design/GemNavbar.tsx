"use client";

import { Navbar, NavbarGroup, Alignment, Classes } from "@blueprintjs/core";

export default function GemNavbar() {
  return (
    <Navbar
      className={Classes.DARK}
      style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
    >
      <NavbarGroup align={Alignment.LEFT}>
        {/* Empty navbar - title moved to page */}
      </NavbarGroup>
    </Navbar>
  );
}
