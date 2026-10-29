import React, { useId } from "react";

/**
 * LogoIcon renders the standalone ThreadPoint vector circular badge
 * based on /threadpoint-logo.svg.
 */
export function LogoIcon({
  size = 36,
  className = "",
  title = "ThreadPoint",
  ...props
}) {
  const id = useId();
  const gradId = `tp-grad-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const isNumericSize = typeof size === "number";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={isNumericSize ? size : undefined}
      height={isNumericSize ? size : undefined}
      className={`shrink-0 ${!isNumericSize && typeof size === "string" ? size : ""} ${className}`}
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3158F5" />
          <stop offset="100%" stopColor="#1747E8" />
        </linearGradient>
      </defs>
      {/* Outer circular badge */}
      <circle cx="512" cy="512" r="462" fill={`url(#${gradId})`} />
      {/* Stylized T */}
      <path
        d="M292 306
           Q292 276 324 276
           H694
           Q720 276 701 296
           L648 350
           Q632 366 610 366
           H563
           Q520 366 520 410
           V735
           Q520 764 492 764
           Q420 764 420 692
           V392
           H324
           Q292 392 292 360 Z"
        fill="#FFFFFF"
      />
      {/* Speech bubble */}
      <path
        d="M588 414
           Q588 384 619 384
           H744
           Q790 384 790 430
           V506
           Q790 552 744 552
           H650
           L617 586
           V552
           Q588 546 588 514 Z"
        fill="#FFFFFF"
      />
      {/* Three message dots */}
      <circle cx="646" cy="468" r="19" fill="#2450EF" />
      <circle cx="690" cy="468" r="19" fill="#2450EF" />
      <circle cx="734" cy="468" r="19" fill="#2450EF" />
    </svg>
  );
}

/**
 * Logo renders either the icon mark or the full brand lockup with text.
 */
export default function Logo({
  size = 36,
  withText = false,
  showText = false,
  subtitle,
  className = "",
  iconClassName = "",
  textClassName = "",
  subtitleClassName = "",
  dark = false,
  onClick,
  ...props
}) {
  const displayWithText = withText || showText || Boolean(subtitle);

  if (!displayWithText) {
    return (
      <LogoIcon
        size={size}
        className={`${className} ${iconClassName}`}
        onClick={onClick}
        {...props}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 group ${onClick ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      <LogoIcon
        size={size}
        className={`transition-transform duration-200 group-hover:scale-105 rounded-full ${iconClassName}`}
      />
      <div className="flex flex-col">
        <span
          className={`font-sans font-bold text-lg sm:text-xl tracking-tight transition-colors leading-tight ${
            dark ? "text-white" : "text-slate-900 group-hover:text-indigo-600"
          } ${textClassName}`}
        >
          ThreadPoint
        </span>
        {subtitle && (
          <span
            className={`text-[10px] font-sans font-medium -mt-0.5 leading-tight ${
              dark ? "text-indigo-300 font-mono" : "text-slate-400"
            } ${subtitleClassName}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
