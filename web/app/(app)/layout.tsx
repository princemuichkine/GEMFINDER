import AppNav from "@/components/design/AppNav";
import { Classes } from "@blueprintjs/core";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${Classes.DARK} flex min-h-screen flex-col`}>
      <AppNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
