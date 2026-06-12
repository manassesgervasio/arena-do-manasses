import { Button, Modal } from "./ui";

export default function ClienteModal({ cliente, moeda, onClose }) {
  if (!cliente) {
    return null;
  }

  return (
    <div
      className="cliente-modal-layer"
      onClick={onClose}
    >
      <Modal
        className="cliente-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>
          {cliente.nome}
        </h2>

        <p>
          Telefone:{" "}
          {cliente.telefone ||
            "Sem telefone"}
        </p>

        <p>
          Jogos pagos:{" "}
          {cliente.jogos}
        </p>

        <p>
          Total pago:{" "}
          {moeda(cliente.pago)}
        </p>

        <p>
          Total pendente:{" "}
          {moeda(cliente.pendente)}
        </p>

        <Button
          onClick={onClose}
        >
          Fechar
        </Button>
      </Modal>
    </div>
  );
}
