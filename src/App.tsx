import { Header } from "./components/header";
import { Outlet } from "@tanstack/react-router";

export const App = () => {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
