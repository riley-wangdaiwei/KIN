import OrderFlow from "@/components/gifts/OrderFlow";
import { giftPackages } from "@/data/gifts";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{
    package?: string;
    source?: string;
    filling?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <OrderFlow
      packages={giftPackages}
      initialPackage={params.package}
      source={params.source}
      initialFilling={params.filling}
      flowerPartnerUrl={process.env.NEXT_PUBLIC_FLOWER_PARTNER_URL}
    />
  );
}
