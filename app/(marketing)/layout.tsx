import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="fixed right-6 top-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
