import { z } from "zod"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { llm } from "..";
import { JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from "../types";

export async function generateEmail(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { query, bestEmployee } = state

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `
        You are an expert in writing professional emails. Write a new version of this email to this user ${bestEmployee!.fullName}, including the subject and content, asking the given candidate for an interview
        on ${process.env.INTERVIEW_TIME} at ${process.env.INTERVIEW_LOCATION}. Recruiter's full name is ${process.env.INTERVIEVER_FULL_NAME}.
        Generate a completely different email based on the user's skills summarization TL;DR ${bestEmployee!.skills}
         
        `
        ],
        [
            "human", `Query: {query}`
        ]
    ])

    const schema = z
        .object({
            subject: z
                .string()
                .describe("The email subject"),
            content: z
                .string()
                .describe("The email content")
        })

    const modelWithTools = llm.withStructuredOutput(schema)

    const chain = prompt.pipe(modelWithTools)

    const res = await chain.invoke({
        query
    })

    return {
        email: res
    }
}