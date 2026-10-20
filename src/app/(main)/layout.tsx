import { AppNav } from "@/components/app-nav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <AppNav />
      <main className="flex-1 px-4 pt-4 pb-28 md:pb-16">{children}</main>
    </div>
  );
}
