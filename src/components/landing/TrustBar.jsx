import { trustMetrics } from "./landingData";

export default function TrustBar() {
  return (
    <section className="landing-trust" aria-label="Pilares do ArenaBase">
      {trustMetrics.map((metric) => (
        <div className="landing-trust-item" key={metric.value}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </section>
  );
}
