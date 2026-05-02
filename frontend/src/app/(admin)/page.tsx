import type { Metadata } from "next";
import React from "react";
import SchoolOverview from "@/components/dashboard/SchoolOverview";

export const metadata: Metadata = {
  title: "Smart Classe Dashboard",
  description: "Connected school management dashboard.",
};

export default function Ecommerce() {
  return <SchoolOverview />;
}
