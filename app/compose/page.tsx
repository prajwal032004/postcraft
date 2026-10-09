import type { Metadata } from "next";
import Composer from "@/components/composer/Composer";
import "./composer.css";

export const metadata: Metadata = {
  title: "Composer — Postcraft",
  description: "Fill a template or write your own HTML, preview it live, and send it from your own email account.",
};

export default function ComposePage() {
  return <Composer />;
}
