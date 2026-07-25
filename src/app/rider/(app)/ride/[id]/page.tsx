import { RiderRideClient } from "@/components/rider/RiderRideClient";

export default function RiderRidePage({ params }: { params: { id: string } }) {
  return <RiderRideClient rideId={params.id} />;
}
