/** Tickets fictícios para o demo. Nenhum dado real. */
export interface Sample {
  id: string;
  label: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "T-1042",
    label: "Fiscal printer stopped",
    text:
      "Desde as 14:30 a impressora fiscal da loja 12 nao imprime cupom. Todos os caixas estao parados e estamos perdendo vendas. Reiniciei a impressora e o computador, mas continua. Aparece erro 0x4F na tela. Versao 8.2.1 do sistema.",
  },
  {
    id: "T-1043",
    label: "Slow reports",
    text:
      "Hola, a veces el informe de inventario tarda mucho en abrir, sobre todo por la tarde. Solo me pasa a mi en mi equipo. No se si es normal, pregunta si hay alguna forma de acelerarlo.",
  },
  {
    id: "T-1044",
    label: "Cannot log in",
    text:
      "User cannot log in since this morning. The account says access denied after entering the password. I tried to reset the password already but the message is the same. Only one user is affected.",
  },
  {
    id: "T-1045",
    label: "Card payments declined",
    text:
      "Todos los pinpad de la tienda 7 rechazan las tarjetas desde la actualizacion de ayer. No podemos vender con tarjeta, solo efectivo. Error 91 en el TEF. Version 3.4.0.",
  },
  {
    id: "T-1046",
    label: "Wrong stock total",
    text:
      "O relatorio de estoque mostra um total errado depois da importacao da planilha de ontem. Faltam cerca de 40 itens. Quando eu exporto para Excel o numero fica diferente do que aparece na tela.",
  },
];
