import { END, START, StateGraph } from "@langchain/langgraph"
import { SupervisorAnnotation, SupervisorState } from "./types"
import { router } from "./router"
import { agent as jobNotificationGraph } from "../job-notification"
import { agent as searchGraph } from "../search"
import { agent as chatGraph } from "../chat"

export const ALL_TOOL_DESCRIPTIONS = `
 - jobNotification: - can select the best candidate for a position and send an email notification
 - search: - access to real-time and relevant web information
`

function handleRoute(state: SupervisorState): "jobNotification" | "search" | "chat" {
    return state.next
}

const builder = new StateGraph(SupervisorAnnotation)
    .addNode("router", router)
    .addNode("jobNotification", jobNotificationGraph)
    .addNode("search", searchGraph)
    .addNode("chat", chatGraph)
    .addConditionalEdges("router", handleRoute, [
        "jobNotification",
        "search",
        "chat"
    ])
    .addEdge(START, "router")
    .addEdge("jobNotification", END)
    .addEdge("search", END)
    .addEdge("chat", END)

export const agent = builder.compile()
agent.name = "Supervisor Agent"

