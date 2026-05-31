import { useMemo, useState } from "react";

export function useAgendaSemana() {
  const [dataBase, setDataBase] = useState(() => {
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    return hoje;
  });
  const dias = useMemo(() => gerarDiasVisiveis(dataBase), [dataBase]);

  function mudarSemana(qtd) {
    const nova = new Date(dataBase);

    nova.setDate(nova.getDate() + qtd * 7);

    setDataBase(nova);
  }

  function alterarData(valor) {
    setDataBase(new Date(valor + "T00:00:00"));
  }

  return {
    dataBase,
    dias,
    mudarSemana,
    alterarData,
  };
}

function gerarDiasVisiveis(dataBase) {
  return Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(dataBase);

    data.setDate(dataBase.getDate() + indice);
    data.setHours(0, 0, 0, 0);

    return data;
  });
}
