import type { ReactNode } from "react";

export function Chip({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "orange";
}) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function Heading({
  title,
  mobile,
  description,
  mobileDescription,
}: {
  title: string;
  mobile?: string;
  description: string;
  mobileDescription?: string;
}) {
  return (
    <header className="heading">
      <h1>
        {mobile ? (
          <>
            <span className="desktop-only">{title}</span>
            <span className="mobile-only">{mobile}</span>
          </>
        ) : (
          title
        )}
      </h1>
      <p>
        {mobileDescription ? (
          <>
            <span className="desktop-only">{description}</span>
            <span className="mobile-only">{mobileDescription}</span>
          </>
        ) : (
          description
        )}
      </p>
    </header>
  );
}
export function Metrics({
  items,
}: {
  items: {
    label: string;
    mobile?: string;
    value: number;
    detail: string;
    green?: boolean;
    desktop?: boolean;
  }[];
}) {
  return (
    <div className="metrics">
      {items.map(({ label, mobile, value, detail, green, desktop }) => (
        <Panel
          key={label}
          className={`metric ${desktop ? "desktop-only" : ""}`}
        >
          <div className="metric-label">
            <span
              className={`metric-dot ${green ? "metric-green" : ""}`}
              aria-hidden="true"
            >
              ●
            </span>
            {mobile ? (
              <>
                <span className="desktop-only">{label}</span>
                <span className="mobile-only">{mobile}</span>
              </>
            ) : (
              label
            )}
          </div>
          <strong>{value}</strong>
          <small className="desktop-only">{detail}</small>
        </Panel>
      ))}
    </div>
  );
}
