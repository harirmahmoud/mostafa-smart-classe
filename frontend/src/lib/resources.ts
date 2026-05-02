import type { ResourceConfig } from "./api";

export const resourceOrder = [
  {
    key: "teachers",
    label: "Teachers",
    description: "Create and manage teacher accounts.",
  },
  {
    key: "departments",
    label: "Departments",
    description: "Manage academic departments.",
  },
  {
    key: "specialities",
    label: "Specialities",
    description: "Link specialities to departments.",
  },
  {
    key: "levels",
    label: "Levels",
    description: "Attach levels to specialities.",
  },
  {
    key: "school-classes",
    label: "Classes",
    description: "Maintain class containers.",
  },
  {
    key: "class-components",
    label: "Class Components",
    description: "Map classroom components to on/off notification APIs.",
  },
  {
    key: "subjects",
    label: "Subjects",
    description: "Assign subjects to classes.",
  },
  {
    key: "students",
    label: "Students",
    description: "Track student identity and level.",
  },
  {
    key: "sessions",
    label: "Sessions",
    description: "Schedule teaching sessions.",
  },
  {
    key: "absences",
    label: "Absences",
    description: "Review attendance records and scans.",
  },
] as const;

export const resourceConfigs: Record<string, ResourceConfig> = {
  teachers: {
    title: "Teachers",
    description: "Create and manage teacher accounts.",
    endpoint: "/users",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "rf_id", label: "RF ID" },
      { key: "created_at", label: "Created", type: "datetime" },
    ],
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "rf_id", label: "RF ID", type: "text" },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },
  departments: {
    title: "Departments",
    description: "Create, rename, and remove academic departments.",
    endpoint: "/departments",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "created_at", label: "Created", type: "datetime" },
    ],
    fields: [{ name: "name", label: "Name", type: "text", required: true }],
  },
  specialities: {
    title: "Specialities",
    description: "Group specialities under the right department.",
    endpoint: "/specialities",
    lookups: [{ field: "department_id", endpoint: "/departments", labelKey: "name" }],
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "department.name", label: "Department" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "department_id", label: "Department", type: "select", required: true },
    ],
  },
  levels: {
    title: "Levels",
    description: "Attach levels to the speciality they belong to.",
    endpoint: "/levels",
    lookups: [{ field: "speciality_id", endpoint: "/specialities", labelKey: "name" }],
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "speciality.name", label: "Speciality" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "speciality_id", label: "Speciality", type: "select", required: true },
    ],
  },
  "school-classes": {
    title: "Classes",
    description: "Manage the class containers used by subjects.",
    endpoint: "/school-classes",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "created_at", label: "Created", type: "datetime" },
    ],
    fields: [{ name: "name", label: "Name", type: "text", required: true }],
  },
  "class-components": {
    title: "Class Components",
    description: "Assign discovered ESP32 APIs to each classroom component.",
    endpoint: "/class-components",
    lookups: [{ field: "school_class_id", endpoint: "/school-classes", labelKey: "name" }],
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Component" },
      { key: "schoolClass.name", label: "Class" },
      { key: "api", label: "Toggle API" },
    ],
    fields: [
      { name: "school_class_id", label: "Class", type: "select", required: true },
      { name: "name", label: "Component Name", type: "text", required: true },
      { name: "api", label: "Toggle API", type: "select", required: true },
    ],
  },
  subjects: {
    title: "Subjects",
    description: "Assign subjects to their owning class.",
    endpoint: "/subjects",
    lookups: [{ field: "school_class_id", endpoint: "/school-classes", labelKey: "name" }],
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "schoolClass.name", label: "Class" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "school_class_id", label: "Class", type: "select", required: true },
    ],
  },
  students: {
    title: "Students",
    description: "Keep student records and RFID references in sync.",
    endpoint: "/students",
    lookups: [{ field: "level_id", endpoint: "/levels", labelKey: "name" }],
    columns: [
      { key: "id", label: "ID" },
      { key: "full_name", label: "Full name" },
      { key: "age", label: "Age" },
      { key: "ref_id", label: "RFID" },
      { key: "level.name", label: "Level" },
    ],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true, min: "1" },
      { name: "ref_id", label: "RFID reference", type: "text", required: true },
      { name: "level_id", label: "Level", type: "select", required: true },
    ],
  },
  sessions: {
    title: "Sessions",
    description: "Schedule sessions and keep the teacher assignment explicit.",
    endpoint: "/sessions",
    lookups: [
      { field: "subject_id", endpoint: "/subjects", labelKey: "name" },
      { field: "teacher_id", endpoint: "/users", labelKey: "name" },
    ],
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "date", label: "Date", type: "datetime" },
      { key: "time", label: "Time" },
      { key: "duration", label: "Duration" },
      { key: "type", label: "Type", type: "badge" },
      { key: "subject.name", label: "Subject" },
      { key: "teacher.name", label: "Teacher" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "time", label: "Time", type: "time", required: true },
      { name: "duration", label: "Duration (minutes)", type: "number", required: true, min: "1" },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { label: "Course", value: "cour" },
          { label: "TD", value: "td" },
          { label: "TP", value: "tp" },
        ],
      },
      { name: "subject_id", label: "Subject", type: "select", required: true },
      { name: "teacher_id", label: "Teacher", type: "select", required: true },
    ],
  },
  absences: {
    title: "Absences",
    description: "Track attendance and record manual or scanned presence.",
    endpoint: "/absences",
    lookups: [
      { field: "student_id", endpoint: "/students", labelKey: "full_name" },
      { field: "session_id", endpoint: "/sessions", labelKey: "name" },
    ],
    scanAction: {
      title: "RFID Scan",
      endpoint: "/absences/scan",
      submitLabel: "Record scan",
      successMessage: "Attendance recorded successfully.",
      fields: [
        { name: "rf_id", label: "RFID reference", type: "text", required: true },
        { name: "session_id", label: "Session", type: "select", required: true },
      ],
    },
    columns: [
      { key: "id", label: "ID" },
      { key: "student.full_name", label: "Student" },
      { key: "session.name", label: "Session" },
      { key: "status", label: "Status", type: "badge" },
      { key: "scan_time", label: "Scan time", type: "datetime" },
    ],
    fields: [
      { name: "student_id", label: "Student", type: "select", required: true },
      { name: "session_id", label: "Session", type: "select", required: true },
    ],
  },
};
