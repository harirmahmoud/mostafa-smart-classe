import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DiscoveryAssignment from "@/components/resources/DiscoveryAssignment";

export default function DiscoveriesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Component Discoveries" />
      <DiscoveryAssignment />
    </div>
  );
}
