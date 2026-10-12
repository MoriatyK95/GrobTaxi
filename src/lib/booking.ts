export type Direction = "to-airport" | "from-airport";
export type VehicleId = "comfort" | "premium" | "xl";

export interface Location {
  id: string;
  name: string;
  address: string;
  km: number;
  minutes: number;
}

export interface Vehicle {
  id: VehicleId;
  name: string;
  description: string;
  passengers: number;
  bags: number;
  baseFare: number;
  badge?: string;
}

export interface JourneyInput {
  locationId: string;
  terminal: string | number;
  date: string;
  time: string;
  passengers: number;
  bags: number;
  direction: Direction;
  flightNumber?: string;
}

// Distances, durations, and prices are illustrative estimates for this demo.
export const locations: Location[] = [
  {
    id: "marina-bay",
    name: "Marina Bay Sands",
    address: "10 Bayfront Avenue, Singapore",
    km: 22,
    minutes: 25,
  },
  {
    id: "orchard",
    name: "Orchard Road",
    address: "2 Orchard Turn, Singapore",
    km: 24,
    minutes: 30,
  },
  {
    id: "bugis",
    name: "Bugis Junction",
    address: "200 Victoria Street, Singapore",
    km: 19,
    minutes: 25,
  },
  {
    id: "sentosa",
    name: "Sentosa Island",
    address: "8 Sentosa Gateway, Singapore",
    km: 28,
    minutes: 35,
  },
  {
    id: "raffles",
    name: "Raffles Place",
    address: "1 Raffles Place, Singapore",
    km: 22,
    minutes: 25,
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "comfort",
    name: "Grob Comfort",
    description: "An easy ride to your next adventure.",
    passengers: 4,
    bags: 2,
    baseFare: 32,
    badge: "MOST POPULAR",
  },
  {
    id: "premium",
    name: "Grob Premium",
    description: "A little extra comfort. A lot more calm.",
    passengers: 4,
    bags: 3,
    baseFare: 48,
  },
  {
    id: "xl",
    name: "Grob XL",
    description: "Room for the whole crew. And their bags.",
    passengers: 6,
    bags: 6,
    baseFare: 52,
  },
];

/** A fixed mock quote in SGD, shared by vehicle selection and confirmation. */
export function getFare(vehicleId: string, locationId: string): number {
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  const location = locations.find((item) => item.id === locationId);
  if (!vehicle || !location)
    throw new Error("Choose a supported vehicle and location to get a fare.");
  return vehicle.baseFare + Math.round(Math.max(0, location.km - 15) * 0.8);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isVehicleSuitable(
  vehicle: Vehicle,
  passengers: number,
  bags: number,
): boolean {
  return (
    Number.isInteger(passengers) &&
    Number.isInteger(bags) &&
    passengers >= 1 &&
    passengers <= vehicle.passengers &&
    bags >= 0 &&
    bags <= vehicle.bags
  );
}

export function validateJourney(
  journey: JourneyInput,
  now = new Date(),
): string | null {
  if (!locations.some((location) => location.id === journey.locationId)) {
    return "Choose a pickup or drop-off location in Singapore.";
  }
  if (!["to-airport", "from-airport"].includes(journey.direction)) {
    return "Choose whether you are going to or from the airport.";
  }
  if (!/^[1-4]$/.test(String(journey.terminal))) {
    return "Choose a Changi Airport terminal from 1 to 4.";
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(journey.date) ||
    !/^\d{2}:\d{2}$/.test(journey.time)
  ) {
    return "Choose a valid pickup date and time.";
  }

  const [year, month, day] = journey.date.split("-").map(Number);
  const [hour, minute] = journey.time.split(":").map(Number);
  // Construct in local time. Parsing an ISO date alone would instead use UTC.
  const pickup = new Date(year, month - 1, day, hour, minute);
  if (
    !Number.isFinite(pickup.getTime()) ||
    pickup.getFullYear() !== year ||
    pickup.getMonth() !== month - 1 ||
    pickup.getDate() !== day ||
    pickup.getHours() !== hour ||
    pickup.getMinutes() !== minute
  ) {
    return "Choose a valid pickup date and time.";
  }
  if (pickup.getTime() <= now.getTime())
    return "Choose a pickup date and time in the future.";
  if (
    !Number.isInteger(journey.passengers) ||
    journey.passengers < 1 ||
    journey.passengers > 6
  ) {
    return "Choose between 1 and 6 passengers.";
  }
  if (!Number.isInteger(journey.bags) || journey.bags < 0 || journey.bags > 6) {
    return "Choose between 0 and 6 bags.";
  }
  if (
    !vehicles.some((vehicle) =>
      isVehicleSuitable(vehicle, journey.passengers, journey.bags),
    )
  ) {
    return "No vehicle can fit this group and luggage. Adjust your passenger or bag count.";
  }
  return null;
}

export function createBookingReference(): string {
  return `GROB-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
