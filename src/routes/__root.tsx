import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/header";

export const Route = createRootRoute({
  component: () => (
    <div
      className="min-h-screen text-[#E6ECF7] font-[Pretendard,Inter,system-ui,sans-serif] text-[13.5px] tabular-nums antialiased"
      style={{
        background:
          "radial-gradient(1100px 700px at 80% -10%, rgba(80,120,220,0.12), transparent 60%), " +
          "radial-gradient(900px 600px at -10% 30%, rgba(60,180,200,0.07), transparent 60%), #0A0E1A",
      }}
    >
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="pb-10">
        <ul className="space-y-2">
          <li>
            본 사이트는 (주)엔씨소프트에서 제공하는 공식 사이트가 아닌 팬 제작
            사이트입니다.
          </li>
          <li>© 2026 . All rights reserved.</li>
          <li>Made by Kai Song</li>
        </ul>
      </footer>
    </div>
  ),
});
