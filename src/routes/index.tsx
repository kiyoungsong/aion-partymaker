import { createFileRoute } from "@tanstack/react-router";
import { RudraPage } from "../page/rudra";

export const Route = createFileRoute("/")({
  component: RudraPage,
});
