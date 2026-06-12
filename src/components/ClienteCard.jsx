import { Badge, Button, Card } from "./ui";

export default function ClienteCard({ cliente, index, formatarDataBR, onClick }) {
  return (
    <Card
      as="article"
      className="cliente-card"
      onClick={onClick}
    >
      <h3
        className="cliente-card-title"
      >
        {index === 0 && "1o"}
        {index === 1 && "2o"}
        {index === 2 && "3o"}
        {cliente.nome}
      </h3>

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
