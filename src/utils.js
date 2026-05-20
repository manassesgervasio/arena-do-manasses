export function formatarData(data) {
  return data.toISOString().split("T")[0];
}

export function formatarDataBR(dataTexto) {
  const [ano, mes, dia] = dataTexto.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function inicioDaSemana(data) {
  const nova = new Date(data);

  const dia = nova.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;

  nova.setDate(nova.getDate() + diff);
  nova.setHours(0, 0, 0, 0);

  return nova;
}

export function gerarDiasDaSemana(dataBase) {
  const inicio = inicioDaSemana(dataBase);

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(inicio);

    data.setDate(inicio.getDate() + i);

    return data;
  });
}

export function moeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

export function numero(valor) {
  return Number(String(valor || "").replace(",", ".")) || 0;
}
