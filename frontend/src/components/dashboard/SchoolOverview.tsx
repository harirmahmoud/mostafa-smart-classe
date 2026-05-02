"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { ApiError, resourceApi } from "@/lib/api";
import { resourceOrder } from "@/lib/resources";
import { useAuth } from "@/context/AuthContext";

type OverviewState = {
  students: number;
  sessions: number;
  absences: number;
  levels: number;
};

export default function SchoolOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OverviewState>({
    students: 0,
    sessions: 0,
    absences: 0,
    levels: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [students, sessions, absences, levels] = await Promise.all([
          resourceApi.list<unknown>("/students"),
          resourceApi.list<unknown>("/sessions"),
          resourceApi.list<unknown>("/absences"),
          resourceApi.list<unknown>("/levels"),
        ]);

        setSummary({
          students: students.length,
          sessions: sessions.length,
          absences: absences.length,
          levels: levels.length,
        });
      } catch (caughtError) {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Unable to load dashboard metrics."
        );
      }
    };

    void loadSummary();
  }, []);

  const metrics = [
    { label: "Students", value: summary.students, path: "/resources/students" },
    { label: "Sessions", value: summary.sessions, path: "/resources/sessions" },
    { label: "Absences", value: summary.absences, path: "/resources/absences" },
    { label: "Levels", value: summary.levels, path: "/resources/levels" },
  ];

  const turnon = async ()=>{
    try {      

      await fetch("http://10.192.206.92")

    } catch (caughtError) {
  
    }

  }

  return (
    <div className="space-y-6">
      <ComponentCard
        title={`Welcome back${user ? `, ${user.name}` : ""}`}
        desc="The dashboard is now connected to the live Laravel API."
      >
        <button onClick={turnon} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-800 dark:text-gray-300">Turn on </button>
        {error && (
          <div className="rounded-lg border border-error-500/20 bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Link
              key={metric.label}
              href={metric.path}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
              <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {metric.value}
              </div>
            </Link>
          ))}
        </div>
      </ComponentCard>

      <ComponentCard title="School data hub" desc="Jump straight into any backend resource.">
        <div className="flex flex-wrap gap-3">
          {resourceOrder.map((resource) => (
            <Link
              key={resource.key}
              href={`/resources/${resource.key}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-800 dark:text-gray-300"
            >
              {resource.label}
            </Link>
          ))}
        </div>
      </ComponentCard>

      <ComponentCard title="Live status" desc="The current session is authenticated through Sanctum tokens.">
        <Badge color="success" size="sm">
          Authenticated
        </Badge>
      </ComponentCard>
    </div>
  );
}
