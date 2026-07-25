import { DriverRideClient } from "@/components/driver/DriverRideClient";

export default function DriverRidePage({ params }: { params: { id: string } }) {
  return <DriverRideClient rideId={params.id} />;
}
