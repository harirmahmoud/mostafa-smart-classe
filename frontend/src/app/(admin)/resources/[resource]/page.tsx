import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ResourceManager from "@/components/resources/ResourceManager";
import { notFound } from "next/navigation";
import { resourceConfigs, resourceOrder } from "@/lib/resources";

type ResourcePageProps = {
  params: Promise<{ resource: string }>;
};

export function generateStaticParams() {
  return resourceOrder.map((resource) => ({ resource: resource.key }));
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { resource } = await params;
  const config = resourceConfigs[resource];

  if (!config) {
    notFound();
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={config.title} />
      <ResourceManager config={config} />
    </div>
  );
}
