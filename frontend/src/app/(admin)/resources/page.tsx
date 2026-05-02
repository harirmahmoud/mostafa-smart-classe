import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { resourceOrder } from "@/lib/resources";
import Link from "next/link";

export default function ResourcesHome() {
  return (
    <div>
      <PageBreadcrumb pageTitle="School Data" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resourceOrder.map((resource) => (
          <ComponentCard key={resource.key} title={resource.label} desc={resource.description}>
            <Link
              href={`/resources/${resource.key}`}
              className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Open manager
            </Link>
          </ComponentCard>
        ))}
      </div>
    </div>
  );
}
