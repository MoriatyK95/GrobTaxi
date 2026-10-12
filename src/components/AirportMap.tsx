import { useId, useState } from "react";
import { locations } from "../lib/booking";
import "./AirportMap.css";

export interface AirportMapProps {
  locationName: string;
  terminal: string;
  direction: "to-airport" | "from-airport";
  locationId: string;
}

const places: Record<string, { x: number; y: number; approach: string }> = {
  orchard: {
    x: 225,
    y: 347,
    approach: "M225 347 L274 324 Q292 315 311 326 L400 373",
  },
  "marina-bay": {
    x: 318,
    y: 464,
    approach: "M318 464 L346 423 Q352 414 365 406 L400 373",
  },
  bugis: {
    x: 322,
    y: 363,
    approach: "M322 363 L346 346 Q354 341 366 348 L400 373",
  },
  sentosa: {
    x: 155,
    y: 522,
    approach:
      "M155 522 L197 479 Q210 464 220 450 L270 413 Q282 404 298 406 L348 417 L400 373",
  },
  raffles: {
    x: 263,
    y: 420,
    approach: "M263 420 L278 408 Q287 402 298 406 L348 417 L400 373",
  },
  custom: {
    x: 248,
    y: 393,
    approach:
      "M248 393 L274 367 Q286 354 305 363 L350 393 Q363 400 375 390 L400 373",
  },
};

const majorRoads = [
  "M-25 150 C138 189 151 248 244 272 S388 272 451 210 S571 98 697 110 S840 122 930 94",
  "M-20 343 L135 308 Q168 301 192 314 L311 376 Q330 388 351 391 L419 400 Q439 402 452 390 L520 345 Q537 335 556 327 L650 288 Q676 277 682 252 L705 169 Q714 135 731 123 L811 62",
  "M86 640 L141 549 Q161 518 184 497 L235 453 Q251 438 267 410 L311 326 Q327 294 350 277 L398 239 L440 166 L472 83 L513 -25",
  "M-15 441 L91 450 Q115 450 130 438 L211 367 Q223 357 239 348 L274 324 Q292 315 311 326 L400 373 C429 337 450 327 498 322 L561 290 Q577 281 583 263 L608 213 Q621 189 647 194 L749 224 L918 281",
  "M220 650 L246 571 Q253 549 276 527 L318 464 L346 423 Q352 414 365 406 L400 373",
  "M603 -20 L582 70 Q578 90 585 108 L608 168 Q615 187 608 213",
  "M99 -25 L143 64 Q153 83 172 101 L227 154 Q247 172 272 180 L360 212 L398 239",
];

const minorRoads = [
  "M12 73 L149 132 L242 207 L367 247 L455 280 L548 291",
  "M-30 226 L108 249 L198 291 L254 316",
  "M-20 389 L100 351 L196 335",
  "M15 517 L91 496 L141 449 L185 404 L224 379",
  "M49 -10 L102 97 L147 186 L183 261 L206 307",
  "M206 -10 L222 79 L273 129 L320 139 L367 160 L431 195",
  "M320 -20 L310 45 L350 90 L408 119 L449 143",
  "M402 -20 L392 63 L405 96 L453 128",
  "M109 252 L89 310 L101 351 L126 394 L166 427",
  "M168 200 L192 156 L227 154 L266 109",
  "M244 272 L272 225 L305 204 L335 165",
  "M350 277 L377 320 L393 349",
  "M400 373 L389 333 L407 302 L451 273 L486 248 L539 223 L597 204",
  "M452 390 L440 425 L408 454 L363 484 L344 524",
  "M520 345 L552 380 L601 395 L662 404",
  "M650 288 L692 316 L740 345 L794 354",
  "M473 81 L527 122 L544 176 L565 217 L583 263",
  "M582 70 L638 77 L685 42 L694 -20",
  "M697 110 L674 148 L672 176 L647 194",
  "M719 203 L773 171 L822 132 L886 134",
  "M755 274 L780 294 L829 313 L890 322",
  "M286 489 L250 484 L217 463 L197 426",
  "M362 41 L434 58 L470 76",
  "M620 352 L628 314 L607 300",
];

const neighbourhoods = [
  { name: "NOVENA", x: 298, y: 230 },
  { name: "ORCHARD", x: 169, y: 291 },
  { name: "DOWNTOWN", x: 271, y: 487 },
  { name: "KALLANG", x: 421, y: 292 },
  { name: "GEYLANG", x: 482, y: 381 },
  { name: "BEDOK", x: 605, y: 352 },
  { name: "TAMPINES", x: 609, y: 163 },
  { name: "PASIR RIS", x: 649, y: 62 },
  { name: "CHANGI", x: 793, y: 122 },
];

function Plane({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-30)`}>
      <path
        d="M-2 13 V3 L-13 8 V3 L-2 -4 V-11 C-2 -15 2 -15 2 -11 V-4 L13 3 V8 L2 3 V13 L6 16 V19 L0 17 L-6 19 V16Z"
        fill="currentColor"
      />
    </g>
  );
}

export default function AirportMap({
  locationName,
  terminal,
  direction,
  locationId,
}: AirportMapProps) {
  const [zoom, setZoom] = useState(1);
  const mapId = useId().replace(/:/g, "");
  const place = places[locationId] ?? places.custom;
  const route = `${place.approach} C429 337 450 327 498 322 L561 290 Q577 281 583 263 L608 213 Q621 189 647 194 L749 224`;
  const displayLocation =
    locationName.length > 24 ? `${locationName.slice(0, 22)}…` : locationName;
  const airportLabel = /^t?[1-4]$/i.test(terminal)
    ? `Terminal ${terminal.replace(/^t/i, "")}`
    : terminal;
  const travelMinutes =
    locations.find((location) => location.id === locationId)?.minutes ?? 25;
  const cityCardX = Math.max(25, place.x - 107);
  const cityCardY = place.y + 25;

  return (
    <div className="airport-map">
      <svg
        className="airport-map__canvas"
        viewBox="0 0 900 620"
        role="img"
        aria-label={`Illustrative route ${direction === "to-airport" ? `from ${locationName} to Changi Airport ${airportLabel}` : `from Changi Airport ${airportLabel} to ${locationName}`}`}
      >
        <defs>
          <pattern
            id={`${mapId}-blocks`}
            width="79"
            height="65"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(23)"
          >
            <rect width="79" height="65" fill="#eeeee6" />
            <rect x="8" y="8" width="25" height="19" rx="3" fill="#e5e6dc" />
            <rect x="39" y="8" width="32" height="19" rx="3" fill="#e3e4da" />
            <rect x="8" y="33" width="35" height="24" rx="3" fill="#e3e4da" />
            <rect x="49" y="33" width="22" height="24" rx="3" fill="#e5e6dc" />
            <path d="M0 0H79V65" fill="none" stroke="#f8f8f2" strokeWidth="5" />
          </pattern>
          <filter
            id={`${mapId}-shadow`}
            x="-30%"
            y="-40%"
            width="160%"
            height="190%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="7"
              floodColor="#233e30"
              floodOpacity="0.12"
            />
          </filter>
          <linearGradient id={`${mapId}-sea`} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#d8e9e5" />
            <stop offset="1" stopColor="#bedcde" />
          </linearGradient>
        </defs>
        <rect width="900" height="620" fill="#eeeee6" />
        <g
          transform={`translate(450 310) scale(${zoom}) translate(-450 -310)`}
          className="airport-map__geography"
        >
          <rect
            x="-600"
            y="-500"
            width="2100"
            height="1700"
            fill={`url(#${mapId}-blocks)`}
          />
          <path
            d="M-20 565 C73 572 109 548 139 551 C174 556 181 553 201 543 C225 529 248 533 266 524 L284 508 C305 524 321 530 338 514 L365 488 C379 480 400 477 418 466 C443 450 453 439 478 435 L539 429 C565 425 576 420 595 425 C619 433 645 429 665 415 C692 397 715 394 738 380 C758 368 769 358 786 350 L847 310 Q872 297 884 272 L925 180 V700 H-20Z"
            fill={`url(#${mapId}-sea)`}
          />
          <path
            d="M-20 565 C73 572 109 548 139 551 C174 556 181 553 201 543 C225 529 248 533 266 524 L284 508 C305 524 321 530 338 514 L365 488 C379 480 400 477 418 466 C443 450 453 439 478 435 L539 429 C565 425 576 420 595 425 C619 433 645 429 665 415 C692 397 715 394 738 380 C758 368 769 358 786 350 L847 310 Q872 297 884 272"
            fill="none"
            stroke="#e2ebd5"
            strokeWidth="13"
          />

          <g fill="#d5ddc6" stroke="#cbd6ba" strokeWidth="1">
            <path d="M53 143 L81 118 Q99 113 114 129 L145 173 L129 214 L96 224 L72 199Z" />
            <path d="M317 62 L350 83 L375 126 L361 151 L327 133 L302 99Z" />
            <path d="M471 122 L503 132 L523 173 L512 200 L484 213 L458 187Z" />
            <path d="M668 10 L704 0 L740 34 L729 68 L700 86 L670 66Z" />
            <path d="M408 445 L445 422 L478 416 L527 410 L530 426 L478 435 L452 443 L429 459Z" />
            <path d="M552 405 L593 401 L621 408 L656 400 L684 392 L715 385 L706 398 L665 415 Q635 434 595 425 L552 428Z" />
            <path d="M790 268 L818 247 L851 258 L847 291 L818 311 L791 299Z" />
            <path d="M158 474 L177 485 L166 509 L150 527 L128 531 L121 513Z" />
          </g>
          <path
            d="M377 396 C364 416 353 443 345 462 S322 491 314 521"
            stroke="#bed7d4"
            strokeWidth="12"
            fill="none"
          />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {minorRoads.map((road, index) => (
              <path key={index} d={road} stroke="#fafaf5" strokeWidth="9" />
            ))}
            {majorRoads.map((road, index) => (
              <path
                key={`edge-${index}`}
                d={road}
                stroke="#dadbd0"
                strokeWidth="23"
              />
            ))}
            {majorRoads.map((road, index) => (
              <path key={index} d={road} stroke="#fcfcf6" strokeWidth="18" />
            ))}
          </g>
          <g transform="translate(814 209) rotate(32)">
            <rect
              x="-45"
              y="-67"
              width="90"
              height="164"
              rx="15"
              fill="#e8e9df"
              stroke="#d7dace"
            />
            <path d="M-29 -51V82 M29 -51V82" stroke="#c3c9bd" strokeWidth="6" />
            <path
              d="M-29 -46V77 M29 -46V77"
              stroke="#fafbf4"
              strokeWidth="1.5"
              strokeDasharray="7 7"
            />
            <path d="M-19 13H19 M0 -20V45" stroke="#c4ccbc" strokeWidth="9" />
          </g>
          <g className="airport-map__neighbourhoods">
            {neighbourhoods.map(({ name, x, y }) => (
              <text key={name} x={x} y={y} textAnchor="middle">
                {name}
              </text>
            ))}
          </g>
          <g className="airport-map__small-labels">
            <text x="98" y="184" textAnchor="middle">
              Botanic
            </text>
            <text x="98" y="200" textAnchor="middle">
              Gardens
            </text>
            <text x="562" y="463" transform="rotate(-6 562 463)">
              East Coast Park
            </text>
            <text x="79" y="547">
              Sentosa
            </text>
            <text x="679" y="539" className="airport-map__sea-label">
              SINGAPORE STRAIT
            </text>
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={route} stroke="#fffef6" strokeWidth="13" />
            <path d={route} stroke="#345a40" strokeWidth="7" />
            <path d={route} stroke="#719165" strokeWidth="1.5" />
          </g>
          <g
            transform="translate(488 324) rotate(-13)"
            filter={`url(#${mapId}-shadow)`}
          >
            <rect
              x="-18"
              y="-11"
              width="36"
              height="22"
              rx="8"
              fill="#fff"
              stroke="#c6cebc"
            />
            <rect x="-9" y="-8" width="19" height="16" rx="4" fill="#304b3a" />
            <path d="M-6 -7V7M7 -7V7" stroke="#b6c8a1" strokeWidth="2" />
            <rect x="14" y="-7" width="2" height="4" rx="1" fill="#d4e99a" />
            <rect x="14" y="3" width="2" height="4" rx="1" fill="#d4e99a" />
          </g>
          <g filter={`url(#${mapId}-shadow)`}>
            <rect
              x="477"
              y="245"
              width="100"
              height="40"
              rx="20"
              fill="#223b2e"
            />
            <circle cx="497" cy="265" r="5" fill="#dbea93" />
            <text x="510" y="270" className="airport-map__time-label">
              {travelMinutes} min
            </text>
          </g>
          <circle
            cx={place.x}
            cy={place.y}
            r="20"
            fill="#345a40"
            opacity="0.1"
          />
          <circle
            cx={place.x}
            cy={place.y}
            r="11"
            fill="#fff"
            stroke="#345a40"
            strokeWidth="4"
          />
          <circle cx={place.x} cy={place.y} r="4" fill="#345a40" />
          <g filter={`url(#${mapId}-shadow)`}>
            <rect
              x={cityCardX}
              y={cityCardY}
              width="214"
              height="63"
              rx="12"
              fill="#fffefa"
            />
            <text
              x={cityCardX + 17}
              y={cityCardY + 23}
              className="airport-map__card-label"
            >
              {direction === "to-airport" ? "YOUR PICKUP" : "YOUR DESTINATION"}
            </text>
            <text
              x={cityCardX + 17}
              y={cityCardY + 45}
              className="airport-map__card-name"
            >
              {displayLocation || "Choose your location"}
            </text>
          </g>
          <circle cx="749" cy="224" r="23" fill="#345a40" opacity="0.1" />
          <circle
            cx="749"
            cy="224"
            r="15"
            fill="#223b2e"
            stroke="#fffefa"
            strokeWidth="4"
          />
          <g color="#dbea93" transform="translate(749 224) scale(.5)">
            <Plane x={0} y={-2} />
          </g>
          <g filter={`url(#${mapId}-shadow)`}>
            <rect
              x="647"
              y="253"
              width="213"
              height="68"
              rx="12"
              fill="#fffefa"
            />
            <rect
              x="660"
              y="267"
              width="39"
              height="39"
              rx="10"
              fill="#edf1df"
            />
            <g color="#345a40" transform="translate(680 284) scale(.6)">
              <Plane x={0} y={0} />
            </g>
            <text x="711" y="279" className="airport-map__card-name">
              Changi Airport
            </text>
            <text x="711" y="301" className="airport-map__terminal-label">
              {airportLabel || "Terminal 3"} ·{" "}
              {direction === "to-airport" ? "Drop-off" : "Pickup"}
            </text>
          </g>
        </g>
      </svg>
      <div className="airport-map__live-badge">
        <span /> A smoother way to fly
      </div>
      <div className="airport-map__zoom" aria-label="Map controls">
        <button
          type="button"
          aria-label="Zoom in on map"
          disabled={zoom >= 1.6}
          onClick={() =>
            setZoom((current) => Math.min(1.6, +(current + 0.2).toFixed(1)))
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Zoom out of map"
          disabled={zoom <= 0.8}
          onClick={() =>
            setZoom((current) => Math.max(0.8, +(current - 0.2).toFixed(1)))
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Reset map zoom"
          onClick={() => setZoom(1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8" />
          </svg>
        </button>
      </div>
      <span className="airport-map__attribution">
        Illustrative route · Singapore
      </span>
    </div>
  );
}
