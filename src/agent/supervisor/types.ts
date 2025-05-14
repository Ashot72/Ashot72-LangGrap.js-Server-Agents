import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const SupervisorAnnotation = Annotation.Root({
    messages: MessagesAnnotation.spec.messages,
    next: Annotation<"jobNotification" | "search" | "chat">
})

export type SupervisorState = typeof SupervisorAnnotation.State
export type SupervisorUpdate = typeof SupervisorAnnotation.Update