"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { EventInput } from "@fullcalendar/core";
import { resourceApi } from "@/lib/api";

interface Session {
  id: number;
  name: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  subject_id: number;
  teacher_id: number;
  subject?: { name: string };
  teacher?: { name: string };
}

interface Level {
  id: number;
  name: string;
  speciality_id: number;
}

interface Speciality {
  id: number;
  name: string;
  department_id: number;
}

const SessionsCalendar: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef(null);

  // Fetch sessions, levels, and specialities on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sessionsRes, levelsRes, specialitiesRes] = await Promise.all([
          resourceApi.list<Session>("/sessions"),
          resourceApi.list<Level>("/levels"),
          resourceApi.list<Speciality>("/specialities"),
        ]);

        setSessions(sessionsRes || []);
        setLevels(levelsRes || []);
        setSpecialities(specialitiesRes || []);
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter sessions based on selected level and speciality
  const filteredSessions = sessions.filter((session) => {
    if (selectedLevel) {
      const subjLevelId = session.subject?.level_id ?? session.subject?.level?.id;
      if (!subjLevelId || String(subjLevelId) !== String(selectedLevel)) return false;
    }

    if (selectedSpeciality) {
      const subjSpecId = session.subject?.speciality_id ?? session.subject?.speciality?.id;
      if (!subjSpecId || String(subjSpecId) !== String(selectedSpeciality)) return false;
    }

    return true;
  });

  // Convert sessions to calendar events
  const calendarEvents: EventInput[] = filteredSessions.map((session) => ({
    id: String(session.id),
    title: `${session.name} - ${session.type.toUpperCase()}`,
    start: `${session.date}T${session.time}`,
    end: `${session.date}T${addMinutesToTime(
      session.time,
      session.duration
    )}`,
    extendedProps: {
      teacher: session.teacher?.name || "Unassigned",
      subject: session.subject?.name || "Unknown",
      duration: session.duration,
      type: session.type,
    },
  }));

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(
      2,
      "0"
    )}`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading sessions calendar...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
            Filter by Level
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level.id} value={String(level.id)}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
            Filter by Speciality
          </label>
          <select
            value={selectedSpeciality}
            onChange={(e) => setSelectedSpeciality(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Specialities</option>
            {specialities.map((spec) => (
              <option key={spec.id} value={String(spec.id)}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          events={calendarEvents}
          eventDisplay="block"
          height="auto"
        />
      </div>
    </div>
  );
};

export default SessionsCalendar;
