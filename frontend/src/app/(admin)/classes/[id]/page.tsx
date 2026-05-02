"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { resourceApi } from "@/lib/api";

interface Component {
  id: number;
  school_class_id: number;
  name: string;
  api: string;
  created_at: string;
  updated_at: string;
}

interface SchoolClass {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const classId = Number(params.id);

  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [toggleSuccess, setToggleSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [classData, componentsData] = await Promise.all([
          resourceApi.get<SchoolClass>(`/school-classes/${classId}`),
          resourceApi.list<Component>("/class-components"),
        ]);
        
        setSchoolClass(classData);
        setComponents(componentsData.filter((c) => c.school_class_id === classId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId]);

  const handleToggle = async (componentId: number, componentName: string) => {
    try {
      setToggling(componentId);
      await resourceApi.post(`/class-components/${componentId}/toggle`, {});
      setToggleSuccess(`${componentName} toggled successfully`);
      setTimeout(() => setToggleSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle component");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Class Details" />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!schoolClass) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Class Not Found" />
        <div className="p-6 bg-red-50 text-red-700 rounded-lg">
          Class not found
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={schoolClass.name} />
      
      <div className="grid gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {toggleSuccess && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            {toggleSuccess}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {schoolClass.name}
            </h1>
            <p className="text-gray-600">
              {components.length} component{components.length !== 1 ? "s" : ""}
            </p>
          </div>

          {components.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No components configured for this class
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {components.map((component) => (
                <div
                  key={component.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {component.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{component.api}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(component.id, component.name)}
                    disabled={toggling === component.id}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {toggling === component.id ? (
                      <span>Toggling...</span>
                    ) : (
                      <span>Toggle On/Off</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
