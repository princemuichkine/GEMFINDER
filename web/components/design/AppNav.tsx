"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Alignment,
  Classes,
  Button,
  Intent,
} from "@blueprintjs/core";

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const gemActive = pathname === "/";
  const searchActive = pathname === "/search";

  return (
    <Navbar
      className={Classes.DARK}
      style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
    >
      <NavbarGroup align={Alignment.LEFT}>
        <NavbarHeading style={{ marginRight: "1.25rem" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[15px] font-semibold text-[#f6f7f9] hover:opacity-90"
          >
            Gemfinder
          </button>
        </NavbarHeading>
        <Button
          minimal
          text="Gemfind"
          intent={gemActive ? Intent.PRIMARY : Intent.NONE}
          onClick={() => router.push("/")}
        />
        <Button
          minimal
          text="Searchfind"
          intent={searchActive ? Intent.PRIMARY : Intent.NONE}
          onClick={() => router.push("/search")}
        />
      </NavbarGroup>
    </Navbar>
  );
}
