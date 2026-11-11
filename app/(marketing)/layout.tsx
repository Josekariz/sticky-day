import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6">
      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle />
      </div>
      <div className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
