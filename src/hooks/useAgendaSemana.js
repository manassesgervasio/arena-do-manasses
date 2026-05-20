import { useMemo, useState } from "react";
import { gerarDiasDaSemana } from "../utils";

export function useAgendaSemana() {
  const [dataBase, setDataBase] = useState(new Date());
  const dias = useMemo(() => gerarDiasDaSemana(dataBase), [dataBase]);

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
