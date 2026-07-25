export type Role = "rider" | "driver";

export type VehicleClass = "economy" | "comfort" | "suv" | "vip";

export type RideStatus =
  | "requested"
  | "accepted"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Vehicle = {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number | null;
  plate_number: string;
  class: VehicleClass;
  color: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type DriverStatus = {
  driver_id: string;
  is_online: boolean;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  updated_at: string;
};

export type Ride = {
  id: string;
  rider_id: string;
  driver_id: string | null;
  status: RideStatus;
  vehicle_class: VehicleClass;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_km: number | null;
  duration_min: number | null;
  estimated_fare_aed: number | null;
  final_fare_aed: number | null;
  cancelled_by: "rider" | "driver" | null;
  cancel_reason: string | null;
  requested_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type Rating = {
  id: string;
  ride_id: string;
  rated_by: Role;
  stars: number;
  comment: string | null;
  created_at: string;
};

export type LngLat = { lng: number; lat: number };
