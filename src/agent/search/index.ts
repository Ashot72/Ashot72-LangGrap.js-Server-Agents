import { TavilySearch } from "@langchain/tavily"
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
    Annotation,
    END,
    MessagesAnnotation,
    START,
    StateGraph
} from "@langchain/langgraph"

const SearchAgentAnnotation = Annotation.Root({
    messages: MessagesAnnotation.spec.messages
})

const graph = new StateGraph(SearchAgentAnnotation)
    .addNode("search", async (state: { messages: Array<HumanMessage | AIMessage> }) => {

        const tavilySearch = new TavilySearch({ maxResults: 1 })
        const userMessage = state.messages.findLast(msg => msg instanceof HumanMessage)

        const query = userMessage?.content || ""
        if (!query) {
            console.log("No query found.")
            return {
                messages: [
                    ...state.messages,
                    new AIMessage("No query was provided to search.")
                ]
            }
        }

        const results = await tavilySearch.invoke({ query: query as string })
        console.log("Results", JSON.stringify(results, null, 2))

        const firstResult = results.results[0]
        if (!firstResult || !firstResult.content) {
            console.log("No results found")
            return {
                messages: [
                    ...state.messages,
                    new AIMessage("Sorry, I couldn't find any results for your query.")
                ]
            }
        }

        return {
            messages: [
                ...state.messages,
                new AIMessage(firstResult.content)

            ]
        }
    })
    .addEdge(START, "search")
    .addEdge("search", END)

export const agent = graph.compile()
agent.name = "Search Agent"
