"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ApiError, resourceApi, type ResourceConfig, type ResourceField, type ResourceOption } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ResourceManagerProps = {
  config: ResourceConfig;
};

type RecordData = Record<string, unknown> & { id: number };

function readNestedValue(item: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, item);
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function asFormValue(field: ResourceField, value: unknown) {
  if (value === null || value === undefined) {
    return field.defaultValue ?? "";
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return value as string | number;
}

export default function ResourceManager({ config }: ResourceManagerProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<RecordData[]>([]);
  const [lookups, setLookups] = useState<Record<string, ResourceOption[]>>({});
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [scanValues, setScanValues] = useState<Record<string, string | number>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [componentApiOptions, setComponentApiOptions] = useState<ResourceOption[]>([]);

  const fieldOptions = useMemo(() => {
    return config.fields.reduce<Record<string, ResourceOption[]>>((accumulator, field) => {
      if (field.type === "select") {
        if (
          config.endpoint === "/class-components" &&
          field.name === "api" &&
          componentApiOptions.length > 0
        ) {
          accumulator[field.name] = componentApiOptions;
        } else {
          accumulator[field.name] = field.options || lookups[field.name] || [];
        }
      }
      return accumulator;
    }, {});
  }, [config.fields, lookups, config.endpoint, componentApiOptions]);

  const loadStoredComponentApis = () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem("mostafa-smart-classe.componentApis");
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as ResourceOption[];
      if (Array.isArray(parsed)) {
        setComponentApiOptions(parsed);
      }
    } catch {
      // Ignore malformed localStorage payload.
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [items, ...lookupResults] = await Promise.all([
        resourceApi.list<RecordData>(config.endpoint),
        ...(config.lookups ?? []).map(async (lookup) => {
          const options = await resourceApi.list<Record<string, unknown>>(lookup.endpoint);
          return {
            field: lookup.field,
            options: options.map((item) => ({
              label: stringifyValue(item[lookup.labelKey]),
              value: item[lookup.valueKey ?? "id"] as string | number,
            })),
          };
        }),
      ]);

      setRecords(items);
      setLookups(
        lookupResults.reduce<Record<string, ResourceOption[]>>((accumulator, entry) => {
          accumulator[entry.field] = entry.options;
          return accumulator;
        }, {})
      );

      if (config.endpoint === "/class-components") {
        try {
          const latest = await resourceApi.get<{ apis?: Array<{ label?: string; api?: string }> }>(
            "/component-discoveries/latest"
          );

          const optionsMap = new Map<string, ResourceOption>();
          (latest.apis ?? []).forEach((apiEntry, index) => {
            if (apiEntry.api) {
              optionsMap.set(apiEntry.api, {
                label: apiEntry.label ?? `Component ${index + 1}`,
                value: apiEntry.api,
              });
            }
          });

          const nextOptions = Array.from(optionsMap.values());
          if (nextOptions.length > 0) {
            setComponentApiOptions(nextOptions);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                "mostafa-smart-classe.componentApis",
                JSON.stringify(nextOptions)
              );
            }
          }
        } catch {
          loadStoredComponentApis();
        }
      }

      if (!editingId) {
        resetForm();
      }
    } catch (caughtError) {
      const message = caughtError instanceof ApiError ? caughtError.message : "Unable to load resource data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoint, authLoading, user, router]);

  useEffect(() => {
    if (config.endpoint === "/class-components") {
      loadStoredComponentApis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoint]);

  const resetForm = () => {
    const nextValues: Record<string, string | number> = {};

    config.fields.forEach((field) => {
      if (field.name === "teacher_id" && user?.id) {
        nextValues[field.name] = user.id;
      } else {
        nextValues[field.name] = field.defaultValue ?? "";
      }
    });

    setFormValues(nextValues);
    setEditingId(null);
  };

  const updateField = (name: string, value: string | number) => {
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const updateScanField = (name: string, value: string | number) => {
    setScanValues((current) => ({ ...current, [name]: value }));
  };

  const handleEdit = (record: RecordData) => {
    const nextValues: Record<string, string | number> = {};

    config.fields.forEach((field) => {
      nextValues[field.name] = asFormValue(field, record[field.name]);
    });

    if (nextValues.teacher_id === "" && user?.id) {
      nextValues.teacher_id = user.id;
    }

    setFormValues(nextValues);
    setEditingId(record.id);
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setSuccess(null);

    try {
      await resourceApi.remove(`${config.endpoint}/${id}`);
      await loadData();
      setSuccess("Record deleted successfully.");
    } catch (caughtError) {
      const message = caughtError instanceof ApiError ? caughtError.message : "Unable to delete the selected record.";
      setError(message);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = config.fields.reduce<Record<string, unknown>>((accumulator, field) => {
        const value = formValues[field.name];
        if (value === "" || value === undefined) {
          return accumulator;
        }

        accumulator[field.name] = field.type === "number" ? Number(value) : value;
        return accumulator;
      }, {});

      if (editingId === null) {
        await resourceApi.create(config.endpoint, payload);
        setSuccess(`${config.title} created successfully.`);
      } else {
        await resourceApi.update(`${config.endpoint}/${editingId}`, payload);
        setSuccess(`${config.title} updated successfully.`);
      }

      await loadData();
      resetForm();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError(`Unable to save ${config.title.toLowerCase()}.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!config.scanAction) {
      return;
    }

    setScanSubmitting(true);
    setError(null);
    setScanSuccess(null);

    try {
      const payload = config.scanAction.fields.reduce<Record<string, unknown>>((accumulator, field) => {
        const value = scanValues[field.name];
        if (value === "" || value === undefined) {
          return accumulator;
        }

        accumulator[field.name] = field.type === "number" ? Number(value) : value;
        return accumulator;
      }, {});

      await resourceApi.scan(config.scanAction.endpoint, payload);
      setScanSuccess(config.scanAction.successMessage ?? "Action completed successfully.");
      setScanValues({});
      await loadData();
    } catch (caughtError) {
      const message = caughtError instanceof ApiError ? caughtError.message : "Unable to complete the scan action.";
      setError(message);
    } finally {
      setScanSubmitting(false);
    }
  };

  const renderField = (field: ResourceField, value: string | number, onChange: (nextValue: string | number) => void) => {
    if (field.type === "select") {
      const options = fieldOptions[field.name] || [];

      return (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        >
          <option value="">Select {field.label}</option>
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <Input
        type={field.type}
        placeholder={field.placeholder || field.label}
        defaultValue={value}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value || 0) : event.target.value)}
        min={field.min}
        max={field.max}
        step={field.step}
      />
    );
  };

  return (
    <div className="space-y-6">
      <ComponentCard title={config.title} desc={config.description}>
        {error && (
          <div className="rounded-lg border border-error-500/20 bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-success-500/20 bg-success-50 px-4 py-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-300">
            {success}
          </div>
        )}

        {config.scanAction && (
          <form onSubmit={handleScanSubmit} className="grid gap-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-white/[0.02] md:grid-cols-3">
            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {config.scanAction.title}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Record RFID scans against a session.
              </p>
            </div>
            {config.scanAction.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                {renderField(
                  field,
                  scanValues[field.name] ?? field.defaultValue ?? "",
                  (nextValue) => updateScanField(field.name, nextValue)
                )}
              </div>
            ))}
            <div className="md:col-span-3">
              <Button type="submit" className="w-full sm:w-auto" disabled={scanSubmitting}>
                {scanSubmitting ? "Processing..." : config.scanAction.submitLabel ?? "Scan"}
              </Button>
            </div>
            {scanSuccess && (
              <div className="md:col-span-3 rounded-lg bg-white px-4 py-3 text-sm text-success-600 dark:bg-gray-900 dark:text-success-300">
                {scanSuccess}
              </div>
            )}
          </form>
        )}
      </ComponentCard>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <ComponentCard title={editingId ? `Edit ${config.title}` : `New ${config.title}`} desc="Create or update a record using the live backend API.">
          <form onSubmit={handleSubmit} className="space-y-5">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-error-500">*</span>}
                </Label>
                {renderField(
                  field,
                  formValues[field.name] ?? field.defaultValue ?? "",
                  (nextValue) => updateField(field.name, nextValue)
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting} className="min-w-32">
                {submitting ? "Saving..." : editingId ? "Update record" : "Create record"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </ComponentCard>

        <ComponentCard title={`${config.title} list`} desc={`Loaded from ${config.endpoint}` }>
          {loading ? (
            <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Loading records...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[900px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {config.columns.map((column) => (
                          <TableCell
                            key={column.key}
                            isHeader
                            className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400"
                          >
                            {column.label}
                          </TableCell>
                        ))}
                        <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          {config.columns.map((column) => {
                            const value = readNestedValue(record, column.key);
                            return (
                              <TableCell key={`${record.id}-${column.key}`} className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-300">
                                {column.type === "badge" ? (
                                  <Badge color="success" size="sm">
                                    {stringifyValue(value)}
                                  </Badge>
                                ) : column.type === "datetime" ? (
                                  stringifyValue(value)
                                ) : (
                                  stringifyValue(value)
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(record)}
                                className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-white/[0.04]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(record.id)}
                                className="rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-800 dark:text-error-300 dark:hover:bg-white/[0.04]"
                              >
                                Delete
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
