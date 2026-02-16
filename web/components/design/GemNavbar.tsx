"use client";

import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Alignment,
} from "@blueprintjs/core";

export default function GemNavbar() {
  return (
    <Navbar className="bp5-dark mb-8">
      <NavbarGroup align={Alignment.LEFT}>
        <NavbarHeading className="text-xl font-bold">
          💎 Gem Hunter
        </NavbarHeading>
      </NavbarGroup>
    </Navbar>
  );
}
