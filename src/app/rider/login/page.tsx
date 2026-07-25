import { LoginForm } from "@/components/shared/LoginForm";

export default function RiderLoginPage() {
  return <LoginForm role="rider" redirectTo="/rider/home" />;
}
