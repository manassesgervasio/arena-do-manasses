import { useMemo } from "react";
import { numero } from "../utils";

export function useResumoReservas(reservas, mesFiltro) {
  return useMemo(() => {
    const lista = Object.entries(reservas).map(([chave, reserva]) => {
      const [data, horario] = chave.split("_");

      return {
        data,
        horario,
        ...reserva,
        valorNumero: numero(reserva.valor),
      };
    });

    const [anoAtual, mesAtual] = mesFiltro.split("-").map(Number);

const listaMes = lista.filter((r) => {
  const data = new Date(r.data + "T00:00:00");

  return (
    data.getMonth() + 1 === mesAtual &&
    data.getFullYear() === anoAtual
  );
});

const faturamentoMes = listaMes
  .filter((r) => r.status === "Pago")
  .reduce((soma, r) => soma + r.valorNumero, 0);

const pendenteMes = listaMes
  .filter((r) => r.status === "Pendente")
  .reduce((soma, r) => soma + r.valorNumero, 0);
    const faturamento = lista
      .filter((r) => r.status === "Pago")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const pendente = lista
      .filter((r) => r.status === "Pendente")
      .reduce((soma, r) => soma + r.valorNumero, 0);

    const jogos = lista.filter(
  (r) =>
    r.cliente &&
    r.cliente.trim() !== "" &&
    ["Pago", "Pendente"].includes(r.status)
).length;

    const pagos = lista.filter((r) => r.status === "Pago").length;

    const reservados = lista.filter(
  (r) => r.status === "Reservado" && r.tipo !== "Fixo"
).length;

    return {
      faturamento,
      pendente,
      jogos,
      pagos,
      reservados,
      faturamentoMes,
      pendenteMes,
      lista,
    };
    }, [reservas, mesFiltro]);
}
