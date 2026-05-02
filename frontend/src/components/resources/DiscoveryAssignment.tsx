"use client";

import { useEffect, useState } from "react";
import { resourceApi } from "@/lib/api";

interface Api {
  label: string;
  api: string;
}

interface Discovery {
  id: number;
  school_class_id: number | null;
  device_id: string;
  apis: Api[];
  created_at: string;
  schoolClass?: { id: number; name: string };
}

interface SchoolClass {
  id: number;
  name: string;
}

interface Component {
  id: number;
  school_class_id: number;
  name: string;
  api: string | null;
}

interface ResourceOption {
  label: string;
  value: number;
}

export default function DiscoveryAssignment() {
  const [unassignedDiscoveries, setUnassignedDiscoveries] = useState<Discovery[]>([]);
  const [assignedDiscoveries, setAssignedDiscoveries] = useState<Discovery[]>([]);
  const [classes, setClasses] = useState<ResourceOption[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Record<number, number>>({});
  const [selectedComponent, setSelectedComponent] = useState<Record<string, number>>({});
  const [newComponentName, setNewComponentName] = useState<Record<string, string>>({});
  const [assigningClass, setAssigningClass] = useState<number | null>(null);
  const [assigningComponent, setAssigningComponent] = useState<string | null>(null);
  const [creatingComponent, setCreatingComponent] = useState<string | null>(null);
  const [deletingDiscoveryId, setDeletingDiscoveryId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [unassignedData, assignedData, classesData, componentsData] = await Promise.all([
        resourceApi.list<Discovery>("/component-discoveries/unassigned"),
        resourceApi.list<Discovery>("/component-discoveries/assigned"),
        resourceApi.list<SchoolClass>("/school-classes"),
        resourceApi.list<Component>("/class-components"),
      ]);

      setUnassignedDiscoveries(unassignedData);
      setAssignedDiscoveries(assignedData);
      setClasses(
        classesData.map((schoolClass) => ({
          label: schoolClass.name,
          value: schoolClass.id,
        }))
      );
      setComponents(componentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableComponents = (classId: number) => {
    return components.filter((component) => component.school_class_id === classId);
  };

  const getMatchedComponent = (discovery: Discovery, api: Api) => {
    return components.find(
      (component) =>
        component.school_class_id === discovery.school_class_id &&
        component.api === api.api
    );
  };

  const handleAssignClass = async (discoveryId: number) => {
    const classId = selectedClass[discoveryId];
    if (!classId) {
      setError("Please select a class first");
      return;
    }

    try {
      setAssigningClass(discoveryId);
      await resourceApi.post(`/component-discoveries/${discoveryId}/assign-class`, {
        school_class_id: classId,
      });

      setSelectedClass((current) => {
        const updated = { ...current };
        delete updated[discoveryId];
        return updated;
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign discovery");
    } finally {
      setAssigningClass(null);
    }
  };

  const handleAssignToComponent = async (discovery: Discovery, api: Api, componentId: number) => {
    if (!componentId) {
      setError("Please select a component first");
      return;
    }

    const key = `${discovery.id}-${api.label}`;

    try {
      setAssigningComponent(key);
      const component = components.find((item) => item.id === componentId);
      if (!component) {
        throw new Error("Component not found");
      }

      await resourceApi.update(`/class-components/${componentId}`, {
        school_class_id: component.school_class_id,
        name: component.name,
        api: api.api,
      });

      setSelectedComponent((current) => {
        const updated = { ...current };
        delete updated[key];
        return updated;
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign API");
    } finally {
      setAssigningComponent(null);
    }
  };

  const handleCreateAndAssign = async (discovery: Discovery, api: Api, classId: number) => {
    const key = `${discovery.id}-${api.label}`;
    const componentName = newComponentName[key] || api.label;

    if (!componentName.trim()) {
      setError("Please enter a component name");
      return;
    }

    try {
      setCreatingComponent(key);
      await resourceApi.create("/class-components", {
        school_class_id: classId,
        name: componentName,
        api: api.api,
      });

      setNewComponentName((current) => {
        const updated = { ...current };
        delete updated[key];
        return updated;
      });

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create component");
    } finally {
      setCreatingComponent(null);
    }
  };

  const handleDeleteDiscovery = async (discoveryId: number) => {
    try {
      setDeletingDiscoveryId(discoveryId);
      await resourceApi.remove(`/component-discoveries/${discoveryId}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete discovery");
    } finally {
      setDeletingDiscoveryId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading discoveries...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Component Discovery Assignment</h2>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Unassigned Discoveries</h3>
            <p className="text-sm text-gray-500">Select a class first, then map APIs to components below.</p>
          </div>

          {unassignedDiscoveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No unassigned component discoveries.</div>
          ) : (
            <div className="space-y-4">
              {unassignedDiscoveries.map((discovery) => (
                <div key={discovery.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">Device: {discovery.device_id}</h4>
                      <p className="text-sm text-gray-600">
                        {discovery.apis.length} component{discovery.apis.length !== 1 ? "s" : ""} discovered
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(discovery.created_at).toLocaleString()}</p>
                  </div>

                  <div className="mb-4 bg-white rounded p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Discovered APIs:</p>
                    <ul className="space-y-1">
                      {discovery.apis.map((api, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{api.label}</span>
                          <br />
                          <code className="text-xs text-gray-500 block truncate">{api.api}</code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                      <select
                        value={selectedClass[discovery.id] || ""}
                        onChange={(event) =>
                          setSelectedClass((current) => ({
                            ...current,
                            [discovery.id]: Number(event.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Choose a class --</option>
                        {classes.map((schoolClass) => (
                          <option key={schoolClass.value} value={schoolClass.value}>
                            {schoolClass.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleAssignClass(discovery.id)}
                      disabled={assigningClass === discovery.id || !selectedClass[discovery.id]}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {assigningClass === discovery.id ? "Assigning..." : "Assign Class"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Assigned Discoveries</h3>
            <p className="text-sm text-gray-500">Existing components for the selected class appear here.</p>
          </div>

          {assignedDiscoveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assigned discoveries yet.</div>
          ) : (
            <div className="space-y-6">
              {assignedDiscoveries.map((discovery) => {
                const classId = discovery.school_class_id || 0;
                const availableComponents = getAvailableComponents(classId);

                return (
                  <div key={discovery.id} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {discovery.schoolClass?.name || "Assigned Class"}
                        </h4>
                        <p className="text-sm text-gray-600">Device: {discovery.device_id}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDiscovery(discovery.id)}
                        disabled={deletingDiscoveryId === discovery.id}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-semibold"
                      >
                        {deletingDiscoveryId === discovery.id ? "Deleting..." : "Delete Discovery"}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {discovery.apis.map((api) => {
                        const assignKey = `${discovery.id}-${api.label}`;
                        const matchedComponent = getMatchedComponent(discovery, api);
                        const selectedValue = selectedComponent[assignKey] || matchedComponent?.id || "";

                        return (
                          <div key={assignKey} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">API: {api.label}</p>
                                <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded block truncate">
                                  {api.api}
                                </code>
                                <p className="mt-2 text-xs text-gray-500">
                                  {matchedComponent ? `Matched to: ${matchedComponent.name}` : "No component matched yet"}
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Component</label>
                                <select
                                  value={selectedValue}
                                  onChange={(event) =>
                                    setSelectedComponent((current) => ({
                                      ...current,
                                      [assignKey]: Number(event.target.value),
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  <option value="">-- Select component --</option>
                                  {availableComponents.map((component) => (
                                    <option key={component.id} value={component.id}>
                                      {component.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() =>
                                    handleAssignToComponent(
                                      discovery,
                                      api,
                                      Number(selectedValue) || 0
                                    )
                                  }
                                  disabled={assigningComponent === assignKey || !selectedValue}
                                  className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                  {assigningComponent === assignKey ? "Assigning..." : "Assign"}
                                </button>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Or Create New</label>
                                <input
                                  type="text"
                                  placeholder={api.label}
                                  value={newComponentName[assignKey] || ""}
                                  onChange={(event) =>
                                    setNewComponentName((current) => ({
                                      ...current,
                                      [assignKey]: event.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                                <button
                                  onClick={() => handleCreateAndAssign(discovery, api, classId)}
                                  disabled={creatingComponent === assignKey}
                                  className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                  {creatingComponent === assignKey ? "Creating..." : "Create & Assign"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}