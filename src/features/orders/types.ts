import type { GiftBrief } from "@/features/brief/types";

export type OrderSource = "board" | "gift-page" | "partner";

export interface GiftOrderRequest {
  orderId: string;
  source: OrderSource;
  packageSlug: string;
  digitalFillings: string[];
  physicalFillings: string[];
  brief: GiftBrief;
  supplementalMaterials: string;
  personalMessage: string;
  purchaserEmail: string;
  recipientName: string;
  deliveryNotes: string;
  rightsConfirmed: boolean;
  privacyConsent: boolean;
}

export interface GiftOrderResponse {
  orderId?: string;
  error?: string;
}

export interface BoardOrderMaterial {
  id: string;
  kind: "label" | "frame";
  title: string;
}
