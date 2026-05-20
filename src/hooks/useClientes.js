import { useMemo } from "react";

export function useClientes(listaReservas, buscaCliente, filtroCliente) {
  const clientes = useMemo(() => {
  const mapa = {};

  listaReservas.forEach((reserva) => {
    if (!reserva.cliente) return;

    const nome = reserva.cliente.trim();
    const telefone = reserva.telefone || "";

    if (!mapa[nome]) {
      mapa[nome] = {
        nome,
        telefone,
        jogos: 0,
        pago: 0,
        pendente: 0,
        ultimaReserva: reserva.data,
      };
    }

    if (reserva.status === "Pago") {
  mapa[nome].jogos += 1;
}

    if (reserva.status === "Pago") {
      mapa[nome].pago += reserva.valorNumero;
    }

    if (reserva.status === "Pendente") {
      mapa[nome].pendente += reserva.valorNumero;
    }

    mapa[nome].ultimaReserva = reserva.data;
  });

  return Object.values(mapa);
}, [listaReservas]);

const clientesFiltrados = clientes
  .filter((cliente) => {
    const buscaOk = cliente.nome
      .toLowerCase()
      .includes(buscaCliente.toLowerCase());

    if (filtroCliente === "Ativos") {
      return buscaOk && cliente.jogos > 0;
    }

    if (filtroCliente === "Inadimplentes") {
      return buscaOk && cliente.pendente > 0;
    }

    return buscaOk;
  })
  .sort((a, b) => {
  if (b.pendente !== a.pendente) {
    return b.pendente - a.pendente;
  }

  if (b.jogos !== a.jogos) {
    return b.jogos - a.jogos;
  }

  return (
    new Date(b.ultimaReserva) -
    new Date(a.ultimaReserva)
  );
});

  return {
    clientes,
    clientesFiltrados,
  };
}
