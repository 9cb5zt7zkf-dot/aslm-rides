import { ProfileClient } from "@/components/shared/ProfileClient";
import { DriverVehicleForm } from "@/components/driver/DriverVehicleForm";

export default function DriverProfilePage() {
  return (
    <ProfileClient loginPath="/driver/login">
      <DriverVehicleForm />
    </ProfileClient>
  );
}
