import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/header";

export const Route = createRootRoute({
  component: () => (
    <div>
      <Header />
      <main
        className="min-h-screen bg-[#0A0E1A] text-[#E6ECF7] font-[Pretendard,Inter,system-ui,sans-serif] text-[13.5px] tabular-nums antialiased
      bg-[radial-gradient(1100px_700px_at_80%_-10%,rgba(80,120,220,0.12),transparent_60%),radial-gradient(900px_600px_at_-10%_30%,rgba(60,180,200,0.07),transparent_60%)]"
      >
        <Outlet />
      </main>
    </div>
  ),
});
