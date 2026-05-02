import SessionsCalendar from "@/components/sessions/SessionsCalendar";

export default function SessionsCalendarPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Sessions Calendar
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View all teaching sessions in a calendar format with filters by level and speciality.
        </p>
      </div>

      <SessionsCalendar />
    </div>
  );
}
