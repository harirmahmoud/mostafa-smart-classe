"use client";

import { useEffect, useState } from "react";
import { resourceApi } from "@/lib/api";

interface Api {
  label: string;
  api: string;
}

interface Discovery {
  id: number;
  school_class_id: number;
  device_id: string;
  apis: Api[];
  created_at: string;
  schoolClass?: { id: number; name: string };
}

interface Component {
  id: number;
  name: string;
  school_class_id: number;
  api?: string;
}

interface ResourceOption {
  label: string;
  value: number;
}

export default function AssignApisToComponents() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<
    Record<string, number>
  >({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [creatingComponent, setCreatingComponent] = useState<string | null>(
    null
  );
  const [newComponentName, setNewComponentName] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [discoveryList, componentList] = await Promise.all([
        resourceApi.list<Discovery>("/component-discoveries/assigned"),
        resourceApi.list<Component>("/class-components"),
      ]);

      setDiscoveries(discoveryList);
      setComponents(componentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableComponents = (classId: number) => {
    return components.filter((c) => c.school_class_id === classId);
  };

  const getComponentName = (componentId: number) => {
    const comp = components.find((c) => c.id === componentId);
    return comp?.name || "Unknown";
  };

  const handleAssignToComponent = async (
    discoveryId: number,
    apiLabel: string,
    componentId: number
  ) => {
    if (!componentId) {
      setError("Please select a component first");
      return;
    }

    const key = `${discoveryId}-${apiLabel}`;
    try {
      setAssigning(key);
      const component = components.find((c) => c.id === componentId);
      if (!component) {
        throw new Error("Component not found");
      }

      await resourceApi.update(`/class-components/${componentId}`, {
        school_class_id: component.school_class_id,
        name: component.name,
        api: `${apiLabel}||${component.api || ""}`, // Store mapping
      });

      setSelectedComponent((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      
      // Reload to show updated state
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign API");
    } finally {
      setAssigning(null);
    }
  };

  const handleCreateAndAssign = async (
    discoveryId: number,
    api: Api,
    classId: number
  ) => {
    const componentName =
      newComponentName[`${discoveryId}-${api.label}`] || api.label;
    if (!componentName.trim()) {
      setError("Please enter a component name");
      return;
    }

    const key = `create-${discoveryId}-${api.label}`;
    try {
      setCreatingComponent(key);
      await resourceApi.create("/class-components", {
        school_class_id: classId,
        name: componentName,
        api: api.api,
      });

      setNewComponentName((prev) => {
        const updated = { ...prev };
        delete updated[`${discoveryId}-${api.label}`];
        return updated;
      });

      // Reload to show new component
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create component");
    } finally {
      setCreatingComponent(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading discoveries...
      </div>
    );
  }

  if (discoveries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No assigned component discoveries. Assign a discovery to a class first.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Assign APIs to Components
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {discoveries.map((discovery) => (
          <div
            key={discovery.id}
            className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {discovery.schoolClass?.name || "Unknown Class"}
              </h3>
              <p className="text-sm text-gray-600">
                Device: {discovery.device_id}
              </p>
            </div>

            <div className="space-y-4">
              {discovery.apis.map((api, idx) => {
                const availableComps = getAvailableComponents(
                  discovery.school_class_id
                );
                const assignKey = `${discovery.id}-${api.label}`;

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {/* API Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          API: {api.label}
                        </p>
                        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded block truncate">
                          {api.api}
                        </code>
                      </div>

                      {/* Assign to Existing Component */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Existing Component
                        </label>
                        <select
                          value={selectedComponent[assignKey] || ""}
                          onChange={(e) =>
                            setSelectedComponent((prev) => ({
                              ...prev,
                              [assignKey]: Number(e.target.value),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- Select component --</option>
                          {availableComps.map((comp) => (
                            <option key={comp.id} value={comp.id}>
                              {comp.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            handleAssignToComponent(
                              discovery.id,
                              api.label,
                              selectedComponent[assignKey]
                            )
                          }
                          disabled={
                            assigning === assignKey ||
                            !selectedComponent[assignKey]
                          }
                          className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {assigning === assignKey ? "Assigning..." : "Assign"}
                        </button>
                      </div>

                      {/* Create New Component */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Or Create New
                        </label>
                        <input
                          type="text"
                          placeholder={api.label}
                          value={newComponentName[assignKey] || ""}
                          onChange={(e) =>
                            setNewComponentName((prev) => ({
                              ...prev,
                              [assignKey]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <button
                          onClick={() =>
                            handleCreateAndAssign(
                              discovery.id,
                              api,
                              discovery.school_class_id
                            )
                          }
                          disabled={creatingComponent === `create-${assignKey}`}
                          className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {creatingComponent === `create-${assignKey}`
                            ? "Creating..."
                            : "Create & Assign"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
