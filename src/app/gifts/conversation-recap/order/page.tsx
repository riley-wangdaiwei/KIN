import { redirect } from "next/navigation";

export default function ConversationRecapOrderPage() {
  redirect("/order?package=conversation-recap&source=gift-page");
}
