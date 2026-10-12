import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import AirportMap from "./components/AirportMap";
import VehicleIllustration from "./components/VehicleIllustration";
import Icon from "./components/Icon";
import {
  locations,
  vehicles,
  getFare,
  formatPrice,
  isVehicleSuitable,
  validateJourney,
  createBookingReference,
} from "./lib/booking";
import type { Direction, JourneyInput, VehicleId } from "./lib/booking";
import "./App.css";

type Booking = JourneyInput & {
  reference: string;
  vehicleId: VehicleId;
  fare: number;
  status: "confirmed" | "cancelled";
};
type Panel = "rides" | "confirmed" | "bookings" | "help" | null;
const STORAGE_KEY = "grobtaxi-airport-bookings-v1";

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDate(date);
}

function readBookings(): Booking[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((item): item is Booking => {
        if (!item || typeof item !== "object") return false;
        return (
          typeof item.reference === "string" &&
          typeof item.fare === "number" &&
          Number.isFinite(item.fare) &&
          locations.some((location) => location.id === item.locationId) &&
          vehicles.some((vehicle) => vehicle.id === item.vehicleId) &&
          ["to-airport", "from-airport"].includes(item.direction) &&
          ["1", "2", "3", "4"].includes(String(item.terminal)) &&
          typeof item.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          typeof item.time === "string" &&
          /^\d{2}:\d{2}$/.test(item.time) &&
          Number.isInteger(item.passengers) &&
          item.passengers >= 1 &&
          item.passengers <= 6 &&
          Number.isInteger(item.bags) &&
          item.bags >= 0 &&
          item.bags <= 6 &&
          (item.flightNumber === undefined ||
            typeof item.flightNumber === "string") &&
          ["confirmed", "cancelled"].includes(item.status)
        );
      })
      .slice(0, 100);
  } catch {
    return [];
  }
}

function journeyDate(booking: JourneyInput) {
  const date = new Date(`${booking.date}T${booking.time}`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function App() {
  const [today] = useState(() => new Date());
  const [direction, setDirection] = useState<Direction>("to-airport");
  const [locationId, setLocationId] = useState("marina-bay");
  const [locationQuery, setLocationQuery] = useState(
    locations.find((location) => location.id === "marina-bay")?.name || "",
  );
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [terminal, setTerminal] = useState("3");
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("09:00");
  const [passengers, setPassengers] = useState(2);
  const [bags, setBags] = useState(2);
  const [flightNumber, setFlightNumber] = useState("");
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>("comfort");
  const [bookings, setBookings] = useState<Booking[]>(readBookings);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(
    null,
  );
  const [storageNotice, setStorageNotice] = useState("");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const activeLocation = locations.find(
    (location) => location.id === locationId,
  );
  const journey: JourneyInput = {
    direction,
    locationId,
    terminal,
    date,
    time,
    passengers,
    bags,
    flightNumber: direction === "from-airport" ? flightNumber.trim() : "",
  };
  const filteredLocations = locations.filter(
    (location) =>
      !locationQuery ||
      location.id === locationId ||
      `${location.name} ${location.address}`
        .toLowerCase()
        .includes(locationQuery.toLowerCase()),
  );
  const activeBookings = bookings.filter(
    (booking) => booking.status === "confirmed",
  ).length;
  const vehicle =
    vehicles.find((option) => option.id === selectedVehicle) || vehicles[0];
  const previewVehicle =
    vehicles.find((option) => isVehicleSuitable(option, passengers, bags)) ||
    vehicles[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (panel && dialog && !dialog.open) dialog.showModal();
    if (!panel && dialog?.open) dialog.close();
    if (panel) {
      dialog?.scrollTo({ top: 0 });
      dialog?.querySelector<HTMLHeadingElement>("#dialog-title")?.focus();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [panel]);

  function saveBookings(next: Booking[]) {
    setBookings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageNotice("");
    } catch {
      setStorageNotice(
        "Browser storage is unavailable. Your demo booking is available until you close this page.",
      );
    }
  }

  function chooseLocation(id: string) {
    const location = locations.find((option) => option.id === id);
    if (!location) return;
    setLocationId(id);
    setLocationQuery(location.name);
    locationInputRef.current?.focus();
    setSuggestionsOpen(false);
    setSuggestionIndex(-1);
    setError("");
  }

  function handleLocationKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setSuggestionIndex((current) =>
        Math.max(
          0,
          Math.min(
            filteredLocations.length - 1,
            current + (event.key === "ArrowDown" ? 1 : -1),
          ),
        ),
      );
    } else if (
      event.key === "Enter" &&
      suggestionsOpen &&
      suggestionIndex >= 0 &&
      filteredLocations[suggestionIndex]
    ) {
      event.preventDefault();
      chooseLocation(filteredLocations[suggestionIndex].id);
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  function findRides(event: FormEvent) {
    event.preventDefault();
    const validation = validateJourney(journey);
    setError(validation || "");
    if (validation) return;
    const suitable = vehicles.find((option) =>
      isVehicleSuitable(option, passengers, bags),
    );
    if (suitable) setSelectedVehicle(suitable.id);
    setSuggestionsOpen(false);
    setPanel("rides");
  }

  function confirmBooking() {
    const validation = validateJourney(journey);
    if (validation || !isVehicleSuitable(vehicle, passengers, bags)) {
      setError(
        validation ||
          "Please choose a vehicle with enough room for your group and luggage.",
      );
      setPanel(null);
      return;
    }
    const booking: Booking = {
      ...journey,
      reference: createBookingReference(),
      vehicleId: selectedVehicle,
      fare: getFare(selectedVehicle, locationId),
      status: "confirmed",
    };
    saveBookings([booking, ...bookings].slice(0, 100));
    setConfirmedBooking(booking);
    setPanel("confirmed");
  }

  function startNewBooking() {
    setPanel(null);
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => locationInputRef.current?.focus(), 100);
  }

  const airportField = (
    <div className="route-field airport-field">
      <span className="route-dot destination-dot">
        <Icon name="plane" size={14} />
      </span>
      <label htmlFor="terminal">
        {direction === "to-airport" ? "DROP-OFF AIRPORT" : "PICKUP AIRPORT"}
      </label>
      <div className="select-wrap">
        <select
          id="terminal"
          value={terminal}
          onChange={(event) => setTerminal(event.target.value)}
        >
          {[1, 2, 3, 4].map((value) => (
            <option key={value} value={value}>
              Changi Airport, Terminal {value}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={15} className="select-chevron" />
      </div>
      <span className="field-hint">Singapore Changi Airport · SIN</span>
    </div>
  );

  const locationField = (
    <div
      className="route-field location-field"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setSuggestionsOpen(false);
      }}
    >
      <span className="route-dot pickup-dot">
        <span />
      </span>
      <label htmlFor="location">
        {direction === "to-airport" ? "PICKUP LOCATION" : "DROP-OFF LOCATION"}
      </label>
      <input
        ref={locationInputRef}
        id="location"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={suggestionsOpen}
        aria-controls="location-options"
        aria-activedescendant={
          suggestionsOpen && suggestionIndex >= 0
            ? `location-option-${suggestionIndex}`
            : undefined
        }
        placeholder="Search a hotel or neighbourhood"
        value={locationQuery}
        onFocus={() => {
          setSuggestionsOpen(true);
          setSuggestionIndex(-1);
        }}
        onChange={(event) => {
          setLocationQuery(event.target.value);
          setLocationId(
            locations.find(
              (location) =>
                location.name.toLowerCase() ===
                event.target.value.toLowerCase(),
            )?.id || "",
          );
          setSuggestionsOpen(true);
          setSuggestionIndex(-1);
        }}
        onKeyDown={handleLocationKeys}
      />
      <span className="field-hint">
        {activeLocation?.address || "Choose from our Singapore demo locations"}
      </span>
      {suggestionsOpen && (
        <div
          className="location-options"
          id="location-options"
          role="listbox"
          aria-label="Singapore locations"
        >
          <div className="suggestion-label">AVAILABLE PICKUP SPOTS</div>
          {filteredLocations.length ? (
            filteredLocations.map((location, index) => (
              <button
                type="button"
                role="option"
                aria-selected={location.id === locationId}
                id={`location-option-${index}`}
                className={suggestionIndex === index ? "highlighted" : ""}
                key={location.id}
                onClick={() => chooseLocation(location.id)}
              >
                <Icon name="pin" size={18} />
                <span>
                  <strong>{location.name}</strong>
                  <small>{location.address}</small>
                </span>
                {location.id === locationId && <Icon name="check" size={17} />}
              </button>
            ))
          ) : (
            <p className="no-locations">
              Try Marina Bay, Orchard, Bugis, Sentosa, or Raffles Place.
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#"
          aria-label="GrobTaxi home"
          onClick={(event) => {
            event.preventDefault();
            setPanel(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-mark">
            <Icon name="plane" size={23} />
          </span>
          grob<span className="brand-light">taxi</span>
          <span className="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={`nav-link ${!panel || panel === "rides" || panel === "confirmed" ? "active" : ""}`}
            onClick={startNewBooking}
          >
            Book a ride
          </button>
          <button
            className={`nav-link ${panel === "bookings" ? "active" : ""}`}
            onClick={() => setPanel("bookings")}
          >
            My bookings
            {activeBookings > 0 && (
              <span className="nav-count">{activeBookings}</span>
            )}
          </button>
          <button
            className={`nav-link ${panel === "help" ? "active" : ""}`}
            onClick={() => setPanel("help")}
          >
            How it works
            <Icon name="chevron" size={13} />
          </button>
        </nav>
        <div className="header-right">
          <span className="locale">
            <Icon name="globe" size={17} />
            Singapore <span>·</span> SGD
          </span>
          <span className="demo-pill">DEMO</span>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="intro-copy">
            <div className="eyebrow">
              <span /> LESS RUSH. MORE JOURNEY.
            </div>
            <h1>
              Your flight awaits.
              <br />
              Your ride is <span>ready.</span>
              <svg
                className="heading-swoosh"
                viewBox="0 0 183 15"
                aria-hidden="true"
              >
                <path d="M3 11Q76-2 179 6" />
              </svg>
            </h1>
            <p>From your doorstep to departures. And all the way home.</p>
          </div>
          <div className="intro-aside">
            <span className="airport-code">
              SIN
              <Icon name="plane" size={31} />
            </span>
            <div className="airport-caption">GOOD JOURNEYS START HERE</div>
            <div className="airport-badge">
              <span className="status-dot" />
              Changi Airport transfers, made simple
            </div>
          </div>
        </section>

        <section
          className="journey-workspace"
          aria-label="Plan your airport transfer"
        >
          <form className="booking-card" ref={formRef} onSubmit={findRides}>
            <div className="card-heading">
              <h2>Where are we headed?</h2>
              <span className="small-plane">
                <Icon name="plane" size={20} />
              </span>
            </div>
            <div
              className="direction-tabs"
              role="group"
              aria-label="Airport journey direction"
            >
              <button
                type="button"
                aria-pressed={direction === "to-airport"}
                className={direction === "to-airport" ? "selected" : ""}
                onClick={() => {
                  setDirection("to-airport");
                  setError("");
                }}
              >
                <Icon name="plane" size={17} />
                To the airport
              </button>
              <button
                type="button"
                aria-pressed={direction === "from-airport"}
                className={direction === "from-airport" ? "selected" : ""}
                onClick={() => {
                  setDirection("from-airport");
                  setError("");
                }}
              >
                <Icon name="plane" size={17} className="arriving-plane" />
                From the airport
              </button>
            </div>
            <div className="route-fields">
              <div className="route-connector" />
              {direction === "to-airport" ? (
                <>
                  {locationField}
                  {airportField}
                </>
              ) : (
                <>
                  {airportField}
                  {locationField}
                </>
              )}
            </div>
            <div className="field-row schedule-row">
              <div className="input-field">
                <label htmlFor="pickup-date">
                  <Icon name="calendar" size={16} />
                  Pickup date
                </label>
                <input
                  id="pickup-date"
                  type="date"
                  value={date}
                  min={localDate(today)}
                  onInput={(event) => setDate(event.currentTarget.value)}
                  required
                />
              </div>
              <div className="input-field">
                <label htmlFor="pickup-time">
                  <Icon name="clock" size={16} />
                  Pickup time
                </label>
                <input
                  id="pickup-time"
                  type="time"
                  value={time}
                  onInput={(event) => setTime(event.currentTarget.value)}
                  required
                />
              </div>
            </div>
            <div className="field-row">
              <div className="input-field">
                <label htmlFor="passengers">
                  <Icon name="user" size={16} />
                  Passengers
                </label>
                <div className="select-wrap">
                  <select
                    id="passengers"
                    value={passengers}
                    onChange={(event) =>
                      setPassengers(Number(event.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((value) => (
                      <option value={value} key={value}>
                        {value} {value === 1 ? "passenger" : "passengers"}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={13} className="select-chevron" />
                </div>
              </div>
              <div className="input-field">
                <label htmlFor="bags">
                  <Icon name="bag" size={16} />
                  Luggage
                </label>
                <div className="select-wrap">
                  <select
                    id="bags"
                    value={bags}
                    onChange={(event) => setBags(Number(event.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((value) => (
                      <option value={value} key={value}>
                        {value} {value === 1 ? "bag" : "bags"}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={13} className="select-chevron" />
                </div>
              </div>
            </div>
            {direction === "from-airport" && (
              <div className="input-field flight-field">
                <label htmlFor="flight-number">
                  <Icon name="plane" size={16} />
                  Flight number <span>optional</span>
                </label>
                <input
                  id="flight-number"
                  value={flightNumber}
                  onChange={(event) =>
                    setFlightNumber(event.target.value.toUpperCase())
                  }
                  maxLength={8}
                  placeholder="e.g. SQ 321"
                  autoComplete="off"
                />
                <small>
                  For your booking reference. No live flight tracking.
                </small>
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button find-button" type="submit">
              Find my airport ride
              <Icon name="arrow" size={20} />
            </button>
            <p className="booking-reassurance">
              <Icon name="shield" size={14} />
              Upfront estimates. A little more peace of mind.
            </p>
          </form>

          <div className="map-card">
            <div className="map-card-heading">
              <div>
                <span className="map-eyebrow">A SMOOTHER WAY TO FLY</span>
                <h2>
                  {direction === "to-airport"
                    ? "City streets. Departure gates."
                    : "Touch down. Head home."}
                </h2>
              </div>
              <span className="live-map-label">
                <span />
                Route preview
              </span>
            </div>
            <AirportMap
              locationName={
                activeLocation?.name ||
                (direction === "to-airport"
                  ? "Your pickup"
                  : "Your destination")
              }
              terminal={terminal}
              direction={direction}
              locationId={locationId || "marina-bay"}
            />
            <div className="trip-estimate">
              <span className="estimate-icon">
                <Icon name="route" size={22} />
              </span>
              <div>
                <span className="estimate-label">YOUR AIRPORT JOURNEY</span>
                <strong>
                  {activeLocation
                    ? `About ${activeLocation.minutes} min`
                    : "Choose your location"}
                  <span className="estimate-separator">/</span>
                  <span className="estimate-distance">
                    {activeLocation ? `${activeLocation.km} km` : "Singapore"}
                  </span>
                </strong>
              </div>
              <div className="estimate-price">
                <small>rides from</small>
                <strong>
                  {formatPrice(
                    getFare(previewVehicle.id, locationId || "marina-bay"),
                  )}
                  <span> SGD</span>
                </strong>
              </div>
            </div>
            <div className="map-bottom">
              <span>
                <Icon name="check" size={13} />
                Door-to-terminal
              </span>
              <span>
                <Icon name="check" size={13} />
                Room for your luggage
              </span>
              <span className="illustrated-label">
                Illustrated route · estimates only
              </span>
            </div>
          </div>
        </section>

        <section className="benefits" aria-label="The GrobTaxi way">
          <div className="benefits-intro">
            <span className="eyebrow">THE GROBTAXI WAY</span>
            <h2>
              A little less stress.
              <br />A better takeoff.
            </h2>
          </div>
          <div className="benefit">
            <span className="benefit-icon">
              <Icon name="card" size={23} />
            </span>
            <h3>Know before you go</h3>
            <p>
              A clear fare estimate before you book.
              <br className="desktop-break" /> No last-minute guesswork.
            </p>
          </div>
          <div className="benefit">
            <span className="benefit-icon">
              <Icon name="bag" size={23} />
            </span>
            <h3>You, and all your baggage</h3>
            <p>
              Flying solo or bringing the whole crew?
              <br className="desktop-break" /> Find a ride with room for
              everyone.
            </p>
          </div>
          <div className="benefit">
            <span className="benefit-icon">
              <Icon name="calendar" size={23} />
            </span>
            <h3>One less thing to plan</h3>
            <p>
              Set your pickup ahead of time.
              <br className="desktop-break" /> Keep your mind on the trip.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          © {today.getFullYear()} GrobTaxi<span className="footer-dot">·</span>
          Made for the journey.
        </span>
        <span>
          <span className="demo-footer-dot" />A demo experience. No real rides
          or payments.
        </span>
        <button onClick={() => setPanel("help")}>
          A little help
          <Icon name="arrow" size={14} />
        </button>
      </footer>

      <dialog
        ref={dialogRef}
        className={`app-dialog ${panel === "confirmed" ? "confirmation-dialog" : ""}`}
        onCancel={() => setPanel(null)}
        onClose={() => setPanel(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-content">
          <button
            className="close-dialog"
            aria-label="Close dialog"
            onClick={() => setPanel(null)}
          >
            <Icon name="close" />
          </button>
          {panel === "rides" && (
            <>
              <span className="eyebrow">A RIDE FOR EVERY TAKEOFF</span>
              <h2 id="dialog-title" tabIndex={-1}>
                Your ride. Your kind of comfort.
              </h2>
              <p className="dialog-subtitle">
                {direction === "to-airport"
                  ? `${activeLocation?.name} → Changi T${terminal}`
                  : `Changi T${terminal} → ${activeLocation?.name}`}
              </p>
              <div className="journey-mini">
                <span>
                  <Icon name="calendar" size={15} />
                  {journeyDate(journey)}
                </span>
                <span>
                  <Icon name="user" size={15} />
                  {passengers}
                </span>
                <span>
                  <Icon name="bag" size={15} />
                  {bags}
                </span>
              </div>
              <fieldset className="vehicle-options">
                <legend className="sr-only">Choose your vehicle</legend>
                {vehicles.map((option) => {
                  const suitable = isVehicleSuitable(option, passengers, bags);
                  return (
                    <label
                      className={`vehicle-option ${selectedVehicle === option.id ? "selected" : ""} ${!suitable ? "unavailable" : ""}`}
                      key={option.id}
                    >
                      <input
                        type="radio"
                        name="vehicle"
                        value={option.id}
                        checked={selectedVehicle === option.id}
                        disabled={!suitable}
                        onChange={() => setSelectedVehicle(option.id)}
                      />
                      <VehicleIllustration
                        variant={option.id}
                        className="vehicle-art"
                      />
                      <span className="vehicle-info">
                        <strong>
                          {option.name}
                          {option.id === "comfort" && (
                            <span className="value-badge">EVERYDAY VALUE</span>
                          )}
                        </strong>
                        <span className="vehicle-description">
                          {option.description}
                        </span>
                        <span className="vehicle-capacity">
                          <span>
                            <Icon name="user" size={13} />
                            {option.passengers}
                          </span>
                          <span>
                            <Icon name="bag" size={13} />
                            {option.bags}
                          </span>
                          {!suitable && <em>Not enough space</em>}
                        </span>
                      </span>
                      <span className="vehicle-fare">
                        {formatPrice(getFare(option.id, locationId))}
                        <small>SGD · total</small>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <div className="payment-note">
                <Icon name="shield" size={19} />
                <span>
                  This is a simulated booking. No payment details needed.
                </span>
              </div>
              <button className="primary-button" onClick={confirmBooking}>
                Confirm {vehicle.name}
                <span>
                  {formatPrice(getFare(selectedVehicle, locationId))}
                  <Icon name="arrow" size={18} />
                </span>
              </button>
              <button className="text-button" onClick={() => setPanel(null)}>
                Back to journey details
              </button>
            </>
          )}
          {panel === "confirmed" && confirmedBooking && (
            <>
              <div className="confirmation-icon">
                <Icon name="check" size={34} />
              </div>
              <span className="eyebrow">ONE LESS THING ON YOUR MIND</span>
              <h2 id="dialog-title" tabIndex={-1}>
                {confirmedBooking.direction === "to-airport"
                  ? "You're all set for takeoff."
                  : "Your ride home is ready."}
              </h2>
              <p className="dialog-subtitle">
                Your demo airport ride is booked.
              </p>
              <div className="booking-ticket">
                <div className="ticket-top">
                  <span>BOOKING REFERENCE</span>
                  <strong>{confirmedBooking.reference}</strong>
                  <span className="confirmed-badge">DEMO CONFIRMED</span>
                </div>
                <div className="ticket-route">
                  <span className="ticket-point" />
                  <div>
                    <small>PICKUP</small>
                    <strong>
                      {confirmedBooking.direction === "to-airport"
                        ? locations.find(
                            (location) =>
                              location.id === confirmedBooking.locationId,
                          )?.name
                        : `Changi Airport, Terminal ${confirmedBooking.terminal}`}
                    </strong>
                  </div>
                  <span className="ticket-point end" />
                  <div>
                    <small>DROP-OFF</small>
                    <strong>
                      {confirmedBooking.direction === "to-airport"
                        ? `Changi Airport, Terminal ${confirmedBooking.terminal}`
                        : locations.find(
                            (location) =>
                              location.id === confirmedBooking.locationId,
                          )?.name}
                    </strong>
                  </div>
                </div>
                <div className="ticket-details">
                  <span>
                    <small>PICKUP TIME · LOCAL</small>
                    <strong>{journeyDate(confirmedBooking)}</strong>
                  </span>
                  <span>
                    <small>YOUR RIDE</small>
                    <strong>
                      {
                        vehicles.find(
                          (option) => option.id === confirmedBooking.vehicleId,
                        )?.name
                      }
                    </strong>
                  </span>
                  <span>
                    <small>TRAVELLERS & LUGGAGE</small>
                    <strong>
                      {confirmedBooking.passengers} passengers ·{" "}
                      {confirmedBooking.bags} bags
                    </strong>
                  </span>
                  <span>
                    <small>ESTIMATED TOTAL</small>
                    <strong>{formatPrice(confirmedBooking.fare)} SGD</strong>
                  </span>
                  {confirmedBooking.flightNumber && (
                    <span>
                      <small>FLIGHT REFERENCE</small>
                      <strong>{confirmedBooking.flightNumber}</strong>
                    </span>
                  )}
                </div>
              </div>
              <p className="demo-note">
                No driver has been dispatched and no payment has been taken.
                This booking is saved in this browser only.
              </p>
              {storageNotice && (
                <p className="form-error" role="status">
                  {storageNotice}
                </p>
              )}
              <button
                className="primary-button"
                onClick={() => setPanel("bookings")}
              >
                View my bookings
                <Icon name="ticket" size={19} />
              </button>
              <button className="text-button" onClick={startNewBooking}>
                Plan another journey
              </button>
            </>
          )}
          {panel === "bookings" && (
            <>
              <span className="eyebrow">YOUR JOURNEYS, ALL TOGETHER</span>
              <h2 id="dialog-title" tabIndex={-1}>
                My bookings
              </h2>
              <p className="dialog-subtitle">
                Your airport plans, with a little peace of mind.
              </p>
              {storageNotice && (
                <p className="form-error" role="status">
                  {storageNotice}
                </p>
              )}
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <span>
                    <Icon name="ticket" size={35} />
                  </span>
                  <h3>Your next journey starts here.</h3>
                  <p>Once you book a demo ride, you'll find it right here.</p>
                  <button className="primary-button" onClick={startNewBooking}>
                    Book an airport ride
                    <Icon name="arrow" size={18} />
                  </button>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <article
                      className={`saved-booking ${booking.status}`}
                      key={booking.reference}
                    >
                      <div className="saved-booking-heading">
                        <span className={`booking-status ${booking.status}`}>
                          {booking.status === "confirmed"
                            ? "Demo confirmed"
                            : "Cancelled"}
                        </span>
                        <small>{booking.reference}</small>
                      </div>
                      <h3>
                        {booking.direction === "to-airport"
                          ? `${locations.find((location) => location.id === booking.locationId)?.name} → Changi T${booking.terminal}`
                          : `Changi T${booking.terminal} → ${locations.find((location) => location.id === booking.locationId)?.name}`}
                      </h3>
                      <p>
                        <Icon name="calendar" size={14} />
                        {journeyDate(booking)}
                      </p>
                      <div className="saved-booking-bottom">
                        <span>
                          {
                            vehicles.find(
                              (option) => option.id === booking.vehicleId,
                            )?.name
                          }{" "}
                          · {booking.passengers} pax · {booking.bags} bags
                        </span>
                        <strong>{formatPrice(booking.fare)}</strong>
                      </div>
                      {booking.status === "confirmed" &&
                        (cancelTarget === booking.reference ? (
                          <div className="cancel-confirm">
                            <span>Cancel this demo booking?</span>
                            <button
                              onClick={() => {
                                saveBookings(
                                  bookings.map((item) =>
                                    item.reference === booking.reference
                                      ? { ...item, status: "cancelled" }
                                      : item,
                                  ),
                                );
                                setCancelTarget(null);
                                dialogRef.current
                                  ?.querySelector<HTMLHeadingElement>(
                                    "#dialog-title",
                                  )
                                  ?.focus();
                              }}
                            >
                              Yes, cancel
                            </button>
                            <button
                              onClick={() => {
                                setCancelTarget(null);
                                dialogRef.current
                                  ?.querySelector<HTMLHeadingElement>(
                                    "#dialog-title",
                                  )
                                  ?.focus();
                              }}
                            >
                              Keep ride
                            </button>
                          </div>
                        ) : (
                          <button
                            className="cancel-booking"
                            onClick={() => setCancelTarget(booking.reference)}
                          >
                            Cancel booking
                          </button>
                        ))}
                    </article>
                  ))}
                </div>
              )}
              <p className="demo-note">
                Demo bookings are stored on this device. No real rides are
                arranged.
              </p>
            </>
          )}
          {panel === "help" && (
            <>
              <span className="eyebrow">FROM DOORSTEP TO DEPARTURES</span>
              <h2 id="dialog-title" tabIndex={-1}>
                Airport rides, minus the rush.
              </h2>
              <p className="dialog-subtitle">
                A simple little plan for your next journey.
              </p>
              <ol className="how-it-works">
                <li>
                  <span>01</span>
                  <div>
                    <h3>Tell us where you're headed</h3>
                    <p>
                      Choose a journey to or from Changi Airport, your terminal,
                      a Singapore location, and your preferred pickup time. All
                      times use your device's local timezone.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>Find your perfect fit</h3>
                    <p>
                      Compare Comfort, Premium, and XL rides. We check there is
                      room for every passenger and bag, and show your estimated
                      fare upfront.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>Make it a plan</h3>
                    <p>
                      Confirm your mock booking and find it in My bookings. You
                      can cancel it there at any time.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="help-note">
                <Icon name="sparkle" size={22} />
                <p>
                  Just exploring? You're in the right place. GrobTaxi is a demo:
                  routes and fares are illustrative, with no live drivers,
                  flight tracking, or payments.
                </p>
              </div>
              <button className="primary-button" onClick={startNewBooking}>
                Let's plan your journey
                <Icon name="arrow" size={19} />
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}

export default App;
