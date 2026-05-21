export default function AppHeader() {
  return (
    <>
      <h1
       className="app-title"
       style={{
    textAlign: "center",
    fontSize: "46px",
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: "1px",
    textShadow: "0 0 18px rgba(34, 197, 94, 0.75)",
    marginBottom: "8px",
        }}
      >
        Arena do Manassés ⚽
      </h1>

      <p
        className="app-subtitle"
        style={{
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        Agenda por datas reais
      </p>
    </>
  );
}
