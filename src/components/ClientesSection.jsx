import ClienteCard from "./ClienteCard";
import ClienteModal from "./ClienteModal";

export default function ClientesSection({
  clientes,
  clientesFiltrados,
  buscaCliente,
  filtroCliente,
  moeda,
  formatarDataBR,
  clienteSelecionado,
  onBuscaClienteChange,
  onFiltroClienteChange,
  onClienteSelect,
  onClienteModalClose,
}) {
  return (
    <div
      style={{
        marginTop: "40px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Card
          titulo="Clientes"
          valor={clientes.length}
        />

        <Card
          titulo="Inadimplentes"
          valor={
            clientes.filter((c) => c.pendente > 0).length
          }
        />
        <Card
          titulo="Total pendente"
          valor={moeda(
            clientes.reduce(
              (total, cliente) =>
                total + cliente.pendente,
              0
            )
          )}
        />

        <Card
          titulo="Clientes ativos"
          valor={
            clientes.filter((c) => c.jogos > 0).length
          }
        />
      </div>
      <h2
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        🏆 Ranking de Clientes
      </h2>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={buscaCliente}
        onChange={onBuscaClienteChange}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      />
      <select
        value={filtroCliente}
        onChange={onFiltroClienteChange}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        <option>Todos</option>
        <option>Ativos</option>
        <option>Inadimplentes</option>
      </select>

      <div
        style={{
          maxHeight: "55vh",
          overflowY: "auto",
          paddingRight: "8px",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {clientesFiltrados.length === 0 && (
            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "16px",
                textAlign: "center",
                color: "#cbd5e1",
                fontWeight: "bold",
              }}
            >
              🔍 Nenhum cliente encontrado
            </div>
          )}
          {clientesFiltrados.map((cliente, index) => (
            <ClienteCard
              key={cliente.nome}
              cliente={cliente}
              index={index}
              formatarDataBR={formatarDataBR}
              onClick={() =>
                onClienteSelect(cliente)
              }
            />
          ))}
        </div>
      </div>
      <ClienteModal
        cliente={clienteSelecionado}
        moeda={moeda}
        onClose={onClienteModalClose}
      />
    </div>
  );
}

function Card({ titulo, valor }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        padding: "22px",
        borderRadius: "22px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <p style={{ color: "#cbd5e1", fontSize: "18px", margin: 0 }}>
        {titulo}
      </p>

      <h2
        style={{
          fontSize: "32px",
          color: "white",
          margin: "10px 0 0",
          wordBreak: "break-word",
          lineHeight: "36px",
        }}
      >
        {valor}
      </h2>
    </div>
  );
}
