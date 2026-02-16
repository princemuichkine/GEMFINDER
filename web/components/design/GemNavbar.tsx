"use client";

import { Button, Navbar, NavbarGroup, NavbarHeading, NavbarDivider, Alignment } from "@blueprintjs/core";
import { useRouter, useSearchParams } from "next/navigation";

export default function GemNavbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentLang = searchParams.get("lang") || "All";

    const setLang = (lang: string) => {
        if (lang === "All") {
            router.push("/");
        } else {
            router.push(`/?lang=${lang}`);
        }
    };

    return (
        <Navbar className="bp5-dark mb-8">
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading className="text-xl font-bold">💎 Gem Hunter</NavbarHeading>
                <NavbarDivider />
                <Button
                    minimal
                    icon="home"
                    text="All Gems"
                    active={currentLang === "All"}
                    onClick={() => setLang("All")}
                />
                <NavbarDivider />
                <Button
                    minimal
                    text="Go"
                    active={currentLang === "go"}
                    onClick={() => setLang("go")}
                />
                <Button
                    minimal
                    text="Rust"
                    active={currentLang === "rust"}
                    onClick={() => setLang("rust")}
                />
                <Button
                    minimal
                    text="TypeScript"
                    active={currentLang === "typescript"}
                    onClick={() => setLang("typescript")}
                />
            </NavbarGroup>
        </Navbar>
    );
}
