import { ChatStore, ROStore } from "../contexts/Store";

export function getNARAContext() {
  const rosState = ROStore.getState();

  return {
    rosConnected: rosState.isConnected,
    robotProject: rosState.robotData.project,
    robotPrefix: rosState.robotData.prefix || "sem namespace",
    cmdVelTopic: rosState.robotData.topic_cmd_vel,
    batteryTopic: rosState.robotData.topic_battery,
    batteryVoltage: rosState.batteryData.voltage,
    batteryPercentage: rosState.batteryData.percentage,
    batteryStatus: rosState.batteryData.status,
  };
}

function getConversationHistory() {
  const history = ChatStore.getState().History;

  return history
    .slice(-6)
    .map((message) => {
      const role =
        message.role === "user" ? "Usuário" : "Assistente";

      return `${role}: ${message.content}`;
    })
    .join("\n");
}

export function buildNARAContextPrompt(question: string) {
  const context = getNARAContext();
  const conversationHistory = getConversationHistory();

  return `
Você é a assistente da interface web denominada noblegipar, IHM este que constitui e pode constituir de vários projetos, incluindo a "NARA" que é uma cadeira de rodas autônoma

Também te passarei o contexto atual dos dados da interface, incluindo os dados do ROS2, assim, poderá responder ao usuário quando as perguntas estiverem relacionadas á estes. Vale ressaltar que o namespace do robô está relacionado á utilização de Múltiplos Robôs, ao qual, não necessariamente será um feature muito utilizado por todos os usuários

Contexto atual:
- Conexão com ROS2: ${context.rosConnected ? "conectada" : "desconectada"}
- Robô selecionado: ${context.robotProject}
- Namespace/prefixo do robô: ${context.robotPrefix}
- Tópico de velocidade: ${context.cmdVelTopic}
- Tópico de bateria: ${context.batteryTopic}
- Tensão da bateria: ${context.batteryVoltage > 0 ? `${context.batteryVoltage} V` : "sem informação"}
- Percentual da bateria: ${context.batteryPercentage > 0 ? `${context.batteryPercentage}%` : "sem informação"}
- Estado da bateria: ${context.batteryStatus}

Regras: 
- Nas conversas seja sucinto, não se expanda nas explicações a não ser que seja estritamente necessário
- Brincar está liberado, mas use de prudência, percebendo a forma que o usuário escreve para definir a forma que você responderá
- Se a informação não estiver disponível, diga isso com clareza

Histórico recente da conversa:
${conversationHistory || "Sem histórico anterior."}

Pergunta do usuário:
${question}
`;
}