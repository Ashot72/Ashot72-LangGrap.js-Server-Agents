import { BaseMessage } from "@langchain/core/messages";

export function formatMessages(messages: BaseMessage[]): string {
    return messages
        .map((m, i) => {
            const role = m.getType()
            const contentString = typeof m.content === "string" ? m.content : JSON.stringify(m.content)
            return `<${role} index="${i}">\n${contentString}\n${role}>`
        })
        .join("\n")
}