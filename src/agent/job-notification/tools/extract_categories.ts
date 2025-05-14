import { StructuredTool } from "langchain/tools"
import { z } from "zod"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { llm } from ".."
import { HIGH_LEVEL_CATEGORY_MAPPING } from "../data/categories"
import { JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from "../types"

export class ExtractHighLevelCategories extends StructuredTool {
    schema = z.object({
        highLevelCategories: z
            .array(
                z
                    .enum(
                        Object.keys(HIGH_LEVEL_CATEGORY_MAPPING) as [string, ...string[]]
                    )
                    .describe("An enum of all categories which best match the query.")
            )
            .describe("The 'High Level Category' to extract from the query.")
    });

    name = "ExtractHighLevelCategories"

    description = "Given a user query, extract the 'High Level Category' which best represents the query."

    async _call(input: z.infer<typeof this.schema>): Promise<string> {
        console.info("High Level Categories", input.highLevelCategories)

        const categoriesMapped = input.highLevelCategories
            .map(
                category => HIGH_LEVEL_CATEGORY_MAPPING[
                    category as keyof typeof HIGH_LEVEL_CATEGORY_MAPPING
                ]
            ).flat()

        return JSON.stringify(categoriesMapped)
    }
}

export async function extractCategories(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { query } = state

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `You are an expert employee recruiter.
        
            Currently, you are helping to select the matching categories of Employee based on the query.
            You are provided with a list of High Level Employee Categories and their corresponding queries.
            Think slowly and carefully to select the best category for the query.
            Here are all the High Level Categories:
            {categories}
        `,
        ],
        ["human", `Query: {query}`],
    ]);

    const tool = new ExtractHighLevelCategories()

    const modelWithTools = llm.withStructuredOutput(tool)

    const chain = prompt.pipe(modelWithTools).pipe(tool)

    const categories = Object.entries(HIGH_LEVEL_CATEGORY_MAPPING).map(
        ([key, value]) => `
               High level category: ${key}, Categories: ${value.join(", ")}
             `
    ).join("\n\n")

    const response = await chain.invoke({
        query,
        categories
    })

    const highLevelCategories: string[] = JSON.parse(response)

    return {
        categories: highLevelCategories
    }
}