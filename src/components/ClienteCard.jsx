import { Badge, Button, Card } from "./ui";

export default function ClienteCard({ cliente, index, formatarDataBR, onClick }) {
  const rankingPosition = index + 1;
  const rankingMedal = ["🥇", "🥈", "🥉"][index];

  return (
    <Card
      as="article"
      className="cliente-card"
      onClick={onClick}
    >
      <div className="cliente-card-header">
        <span
          className={`cliente-ranking-position${rankingMedal ? " cliente-ranking-medal" : ""}`}
          aria-label={`${rankingPosition}º lugar`}
        >
          {rankingMedal || `${rankingPosition}º`}
        </span>

        <h3
          className="cliente-card-title"
        >
          {cliente.nome}
        </h3>
      </div>

      <p>{cliente.telefone || "Sem telefone"}</p>

      {cliente.telefone && (
        <Button
          as="a"
          className="cliente-whatsapp-link"
          href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </Button>
      )}

      {cliente.pendente > 0 && (
        <Badge className="cliente-badge" tone="warning">
          Inadimplente
        </Badge>
      )}

      <p className="cliente-last-reserva">
        Ultima reserva: {formatarDataBR(cliente.ultimaReserva)}
      </p>
    </Card>
  );
}
