import ClienteCard from "./ClienteCard";
import ClienteModal from "./ClienteModal";
import { Card, EmptyState, Input, Select } from "./ui";

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
    <div className="clientes-section">
      <div className="clientes-stats-grid">
        <StatCard titulo="Clientes" valor={clientes.length} />
        <StatCard
          titulo="Inadimplentes"
          valor={clientes.filter((c) => c.pendente > 0).length}
        />
        <StatCard
          titulo="Total pendente"
          valor={moeda(
            clientes.reduce((total, cliente) => total + cliente.pendente, 0)
          )}
        />
        <StatCard
          titulo="Clientes ativos"
          valor={clientes.filter((c) => c.jogos > 0).length}
        />
      </div>

      <h2 className="clientes-heading">Ranking de Clientes</h2>

      <Input
        className="clientes-search"
        type="text"
        placeholder="Buscar cliente..."
        value={buscaCliente}
        onChange={onBuscaClienteChange}
      />

      <Select
        className="clientes-filter-select"
        value={filtroCliente}
        onChange={onFiltroClienteChange}
      >
        <option>Todos</option>
        <option>Ativos</option>
        <option>Inadimplentes</option>
      </Select>

      <div className="clientes-list-scroll">
        <div className="clientes-list-grid">
          {clientesFiltrados.length === 0 && (
            <EmptyState>Nenhum cliente encontrado</EmptyState>
          )}

          {clientesFiltrados.map((cliente, index) => (
            <ClienteCard
              key={cliente.nome}
              cliente={cliente}
              index={index}
              formatarDataBR={formatarDataBR}
              onClick={() => onClienteSelect(cliente)}
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

function StatCard({ titulo, valor }) {
  return (
    <Card className="clientes-stat-card">
      <p>{titulo}</p>
      <h2 className="clientes-stat-value">{valor}</h2>
    </Card>
  );
}
