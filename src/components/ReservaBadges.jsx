export default function ReservaBadges({ tipo }) {
  return (
    <>
      {tipo === "Mensalista" && (
        <span className="reserva-badge reserva-badge-mensalista">
          ⭐ MENSALISTA
        </span>
      )}
      {tipo === "Fixo" && (
        <span className="reserva-badge reserva-badge-fixo">📍 FIXO</span>
      )}
    </>
  );
}
