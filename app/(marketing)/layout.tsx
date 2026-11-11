export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
