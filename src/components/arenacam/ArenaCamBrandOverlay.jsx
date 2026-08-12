export default function ArenaCamBrandOverlay({ logoUrl = "" }) {
  if (!logoUrl) return null;

  return (
    <div className="arenacam-brand-overlay" aria-hidden="true">
      <img src={logoUrl} alt="" loading="lazy" />
    </div>
  );
}
