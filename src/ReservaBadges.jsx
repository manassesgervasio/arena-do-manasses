export default function ReservaBadges({ tipo }) {
  return (
    <>
      {tipo === "Mensalista" && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: "#2563eb",
            marginBottom: "4px",
          }}
        >
          ⭐ Mensalista
        </div>
      )}
      {tipo === "Fixo" && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: "#2563eb",
            marginBottom: "4px",
          }}
        >
          🔒 Fixo
        </div>
      )}
    </>
  );
}
