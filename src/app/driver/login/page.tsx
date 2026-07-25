import { LoginForm } from "@/components/shared/LoginForm";

export default function DriverLoginPage() {
  return <LoginForm role="driver" redirectTo="/driver/home" />;
}
