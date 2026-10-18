import { notFound } from "next/navigation";
import GiftPackagePage from "@/components/gifts/GiftPackagePage";
import { giftPackages, getGiftPackage } from "@/data/gifts";

export function generateStaticParams() {
  return giftPackages.map((gift) => ({ slug: gift.slug }));
}

export default async function GiftDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gift = getGiftPackage(slug);
  if (!gift) notFound();

  return <GiftPackagePage gift={gift} />;
}
