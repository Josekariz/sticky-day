import { AppearanceSelect } from "@/components/theme/AppearanceSelect";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col p-6">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <AppearanceSelect />
      </div>
      <div className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
