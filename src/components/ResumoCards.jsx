import { Card } from "./ui";

export default function ResumoCards({ resumo, moeda }) {
  return (
    <div
      className="resumo-cards-grid"
    >
      <ResumoCard titulo="Faturamento" valor={moeda(resumo.faturamento)} />
      <ResumoCard titulo="Pendente" valor={moeda(resumo.pendente)} />
      <ResumoCard titulo="Jogos" valor={resumo.jogos} />
      <ResumoCard titulo="Pagos" valor={resumo.pagos} />
      <ResumoCard titulo="Reservados" valor={resumo.reservados} />
      <ResumoCard
        titulo="Total mensalistas"
        valor={moeda(resumo.totalMensalistas || 0)}
      />
      <ResumoCard
        titulo="Total geral"
        valor={moeda(resumo.totalGeral || 0)}
      />
      <ResumoCard
        titulo="Mês Pago"
        valor={moeda(resumo.faturamentoMes)}
      />

      <ResumoCard
        titulo="Mês Pendente"
        valor={moeda(resumo.pendenteMes)}
      />
    </div>
  );
}

function ResumoCard({ titulo, valor }) {
  const valorTexto = String(valor ?? "");
  const valorMonetario = valorTexto.trim().startsWith("R$");
  const valorSemMoeda = valorMonetario
    ? valorTexto.replace(/^R\$\s*/, "")
    : valorTexto;

  return (
    <Card className="resumo-card">
      <p>{titulo}</p>

      <h2
        className={`resumo-card-value${
          valorMonetario ? " is-money" : " is-count"
        }`}
      >
        {valorMonetario ? (
          <>
            <span className="resumo-card-currency">R$</span>
            <span className="resumo-card-amount">{valorSemMoeda}</span>
          </>
        ) : (
          <span className="resumo-card-amount">{valorTexto}</span>
        )}
      </h2>
    </Card>
  );
}
