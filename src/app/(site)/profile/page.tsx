import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Личный кабинет", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return (
    <Container className="py-8 md:py-12">
      <ProfileView />
    </Container>
  );
}
