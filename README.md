# GrobTaxi

A responsive React mockup for airport transfers to and from Singapore Changi Airport. Choose a terminal, plan a pickup, compare vehicles, and save a simulated booking.

## Run locally

Use Node.js 24 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Features

- Transfers to or from Changi terminals 1–4.
- Searchable demo locations: Marina Bay Sands, Orchard Road, Bugis Junction, Sentosa Island, and Raffles Place.
- Scheduled pickups with future date/time validation, passenger counts, luggage, and an optional arrival flight reference.
- Comfort, Premium, and XL vehicles with capacity checks and deterministic SGD fare estimates.
- Original illustrated Singapore route map with location-aware endpoints and zoom controls.
- Booking confirmation, browser-local booking history, and cancellation.
- Responsive desktop/mobile layouts, keyboard location selection, and native modal dialogs with focus management.

## Commands

| Command           | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server.                                     |
| `npm run build`   | Check application TypeScript and create a production build in `dist/`. |
| `npm run lint`    | Run Oxlint.                                                            |
| `npm test`        | Run the airport booking domain tests with Node's built-in test runner. |
| `npm run preview` | Preview the production build after building.                           |

## Demo boundaries

This is a frontend prototype. No real rides, drivers, payments, flight tracking, geolocation, or navigation services are connected. Routes, distances, journey times, and prices are illustrative. Pickup dates and times use the browser's local timezone.

Bookings are stored under `grobtaxi-airport-bookings-v1` in localStorage on the current browser and device. Clearing site data removes that history. If storage is unavailable, bookings remain available only for the current page session.

The application uses Google Fonts with system-font fallbacks; all map and vehicle illustrations are original local SVG components.

## Project structure

- `src/App.tsx` — journey form, booking flow, dialogs, and browser-local persistence.
- `src/components/` — interactive map, vehicle illustrations, and shared icons.
- `src/lib/booking.ts` — demo locations, vehicle capacities, fare calculations, and validation.
- `src/lib/booking.test.ts` — date/time, route, capacity, fare, and reference tests.

Built with React, TypeScript, Vite, and Oxlint.
