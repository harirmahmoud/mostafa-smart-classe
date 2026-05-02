"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { resourceApi } from "@/lib/api";

interface Component {
  id: number;
  school_class_id: number;
  name: string;
  api: string;
  created_at: string;
  updated_at: string;
  schoolClass: { id: number; name: string };
}

interface SchoolClass {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Discovery {
  id: number;
  school_class_id: number | null;
  device_id: string;
  apis: Array<{ label: string; api: string }>;
  created_at: string;
  schoolClass?: { id: number; name: string };
}

export default function ClassesKanbanPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingComponentId, setDeletingComponentId] = useState<number | null>(null);
  const [deletingDiscoveryId, setDeletingDiscoveryId] = useState<number | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesData, componentsData, discoveriesData] = await Promise.all([
        resourceApi.list<SchoolClass>("/school-classes"),
        resourceApi.list<Component>("/class-components"),
        resourceApi.list<Discovery>("/component-discoveries/assigned"),
      ]);

      setClasses(classesData);
      setComponents(componentsData);
      setDiscoveries(discoveriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getComponentsByClass = (classId: number) => {
    return components.filter((component) => component.school_class_id === classId);
  };

  const getDiscoveriesByClass = (classId: number) => {
    return discoveries.filter((discovery) => discovery.school_class_id === classId);
  };

  const handleDeleteComponent = async (componentId: number) => {
    try {
      setDeletingComponentId(componentId);
      await resourceApi.remove(`/class-components/${componentId}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete component");
    } finally {
      setDeletingComponentId(null);
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
    return (
      <div>
        <PageBreadcrumb pageTitle="Classes Kanban" />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Classes Kanban" />
        <div className="p-6 bg-red-50 text-red-700 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Classes Kanban" />
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-6" style={{ minWidth: "100%" }}>
          {classes.map((schoolClass) => {
            const classComponents = getComponentsByClass(schoolClass.id);
            const classDiscoveries = getDiscoveriesByClass(schoolClass.id);

            return (
              <div key={schoolClass.id} className="flex-shrink-0 w-96">
                <div className="bg-gray-100 rounded-lg p-4 sticky top-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{schoolClass.name}</h3>
                      <p className="text-sm text-gray-600">
                        {classComponents.length} component{classComponents.length !== 1 ? "s" : ""} · {classDiscoveries.length} device{classDiscoveries.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <Link
                      href={`/classes/${schoolClass.id}`}
                      className="text-xs px-3 py-2 rounded-lg bg-white text-gray-700 shadow hover:shadow-md transition-shadow"
                    >
                      View
                    </Link>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Components</p>
                    {classComponents.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center py-6 bg-white rounded-lg shadow">No components</div>
                    ) : (
                      <div className="space-y-3">
                        {classComponents.map((component) => (
                          <div key={component.id} className="bg-white rounded-lg p-4 shadow">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{component.name}</h4>
                                <p className="text-xs text-gray-500 mt-2 truncate">{component.api}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteComponent(component.id)}
                                disabled={deletingComponentId === component.id}
                                className="px-2 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
                              >
                                {deletingComponentId === component.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Connected Devices</p>
                    {classDiscoveries.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center py-6 bg-white rounded-lg shadow">No connected devices</div>
                    ) : (
                      <div className="space-y-3">
                        {classDiscoveries.map((discovery) => (
                          <div key={discovery.id} className="bg-white rounded-lg p-4 shadow">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{discovery.device_id}</h4>
                                <p className="text-xs text-gray-500 mt-2">
                                  {discovery.apis.length} API{discovery.apis.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteDiscovery(discovery.id)}
                                disabled={deletingDiscoveryId === discovery.id}
                                className="px-2 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
                              >
                                {deletingDiscoveryId === discovery.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}