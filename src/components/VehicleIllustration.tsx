import { useId } from "react";
import type { VehicleId } from "../lib/booking";

interface VehicleIllustrationProps {
  variant: VehicleId;
  className?: string;
}

/** Small original vector illustrations keep the mock fleet crisp at any size. */
export function VehicleIllustration({
  variant,
  className,
}: VehicleIllustrationProps) {
  const id = useId().replaceAll(":", "");
  const isVan = variant === "xl";
  const isPremium = variant === "premium";
  const colors = isVan
    ? ["#789285", "#35594b", "#244336", "#b6cabd"]
    : isPremium
      ? ["#667076", "#2f373c", "#182024", "#939ea4"]
      : ["#fafbfc", "#cbd0d4", "#929ca4", "#ffffff"];
  const body = isVan
    ? "M37 96 42 53Q43 43 54 40L220 34Q237 34 248 49L273 74 303 81Q316 85 317 96L317 112 286 118Q282 83 257 83Q229 83 226 118H116Q112 83 85 84Q58 85 55 116L38 112Z"
    : isPremium
      ? "M35 98 40 84Q43 79 62 76L91 54Q106 43 126 41L187 40Q205 40 220 53L247 73 294 81Q313 84 319 99L317 113 285 117Q281 84 255 84Q229 84 225 118H117Q113 84 86 84Q60 84 55 117L37 112Z"
      : "M35 98 42 82Q45 78 62 75L90 51Q101 43 115 42L185 41Q205 41 219 53L242 73 293 82Q310 85 316 99L315 113 285 117Q281 84 255 84Q229 84 225 118H117Q113 84 86 84Q60 84 55 117L37 113Z";

  return (
    <svg
      className={className}
      viewBox="0 0 360 160"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-body`}
          x1="175"
          y1="35"
          x2="181"
          y2="121"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors[0]} />
          <stop offset="0.37" stopColor={colors[1]} />
          <stop offset="0.52" stopColor={colors[3]} />
          <stop offset="0.59" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[2]} />
        </linearGradient>
        <linearGradient
          id={`${id}-glass`}
          x1="122"
          y1="38"
          x2="161"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#31494e" />
          <stop offset="0.5" stopColor="#627c81" />
          <stop offset="1" stopColor="#21363c" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop stopColor="#f3f5f6" />
          <stop offset="0.68" stopColor="#a1aab0" />
          <stop offset="1" stopColor="#424d56" />
        </radialGradient>
        <filter
          id={`${id}-shadow`}
          x="-20%"
          y="-100%"
          width="140%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse
        cx="180"
        cy="132"
        rx="141"
        ry="7"
        fill="#273b32"
        opacity="0.13"
        filter={`url(#${id}-shadow)`}
      />
      <path d="M50 106H300V119H50Z" fill="#1e282b" />
      <path
        d={body}
        fill={`url(#${id}-body)`}
        stroke={colors[2]}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {isVan ? (
        <>
          <path d="M56 46 131 43V73H51Z" fill={`url(#${id}-glass)`} />
          <path
            d="M138 43 216 40Q231 40 241 53L258 73H138Z"
            fill={`url(#${id}-glass)`}
          />
          <path
            d="M207 40V73M132 43V109M211 77V109"
            stroke="#142825"
            strokeOpacity="0.75"
            strokeWidth="2"
          />
          <path
            d="M62 48 124 46M143 46 211 43"
            stroke="#d6e6e6"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          <path
            d="M55 79H216V109H121M143 83H155M219 83H231"
            stroke={colors[2]}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M76 74 96 55Q107 47 119 47L151 46V74Z"
            fill={`url(#${id}-glass)`}
          />
          <path
            d="M158 46 185 46Q200 46 212 57L230 73H158Z"
            fill={`url(#${id}-glass)`}
          />
          <path
            d="M98 56Q106 49 120 49L147 48M163 48 184 48Q198 48 210 58"
            stroke="#e2edee"
            strokeOpacity="0.65"
            strokeWidth="1.8"
          />
          <path
            d="M153 45V74M161 77 162 110M230 77 238 88"
            stroke={colors[2]}
            strokeWidth="1.6"
          />
          <path
            d="M75 78 68 85M116 111 155 112Q160 112 160 106M164 112H222"
            stroke={colors[2]}
            strokeOpacity="0.8"
          />
          <path
            d="M133 83H144M203 83H216"
            stroke={isPremium ? "#a2aeb4" : "#65747c"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        d={isVan ? "M43 78H267L305 87" : "M43 81 74 78H236L301 88"}
        stroke={colors[3]}
        strokeOpacity="0.65"
        strokeWidth="1.4"
      />
      <path
        d="M121 117H220"
        stroke={colors[2]}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M287 88 306 93 310 100 284 97Z"
        fill="#edf6f4"
        stroke={colors[2]}
        strokeWidth="0.7"
      />
      <path
        d="M288 91 306 96"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M40 87 54 84 53 94 38 97Z" fill="#b55c52" />
      <path d="M301 104 316 104 315 110 299 110" fill="#253538" />
      <path
        d={
          isVan
            ? "M243 73 254 72 261 77 254 80 242 79Z"
            : "M221 72 233 71 241 77 234 81 222 79Z"
        }
        fill={colors[2]}
        stroke={colors[3]}
        strokeWidth="0.65"
      />
      {[86, 255].map((x) => (
        <g key={x}>
          <circle cx={x} cy="111" r="23" fill="#182125" />
          <circle cx={x} cy="111" r="19.7" stroke="#3d474c" strokeWidth="1.5" />
          <circle cx={x} cy="111" r="15.5" fill={`url(#${id}-rim)`} />
          <circle cx={x} cy="111" r="12" fill="#3b464c" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <path
              key={angle}
              d={`M${x - 2} 108 ${x - 4} 98 ${x + 1} 96 ${x + 3} 108Z`}
              fill="#c7ced2"
              transform={`rotate(${angle} ${x} 111)`}
            />
          ))}
          <circle
            cx={x}
            cy="111"
            r="5.5"
            fill="#818c93"
            stroke="#dee3e5"
            strokeWidth="1"
          />
          <circle cx={x} cy="111" r="2.5" fill="#d5dde0" />
        </g>
      ))}
    </svg>
  );
}

export default VehicleIllustration;
