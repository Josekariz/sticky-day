import { Navbar } from "@/components/nav/Navbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
    </>
  );
}