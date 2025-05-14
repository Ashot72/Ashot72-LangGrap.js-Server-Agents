import { StructuredTool } from "langchain/tools";
import { z } from "zod"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { EmployeeProfile, JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from "../types";
import { llm } from "..";

export class SelectEmployeeTool extends StructuredTool {
    schema: z.ZodObject<{
        employeeId: z.ZodEnum<[string, ...string[]]>;
    },
        "strip",
        z.ZodTypeAny,
        {
            employeeId: string
        },
        {
            employeeId: string
        }
    >;

    name = "Select_EmployeeId"

    description: string;

    employees: EmployeeProfile[]

    constructor(employees: EmployeeProfile[], query: string) {
        super()
        this.description = SelectEmployeeTool.createDescription(employees, query)
        this.schema = z.object({
            employeeId: z
                .enum(employees.map(employee => employee.id.toString()) as [string, ...string[]])
                .describe("The Employee Id of the Employee which best matches the query")
        })
        this.employees = employees
    }

    static createDescription(employees: EmployeeProfile[], query: string): string {
        const description = `Given the following query by a user, select the Employee Id which will
        best serve the query.

        Query: ${query}

        Employees:
        ${employees.map(
            employee => `
                 Id: ${employee.id}
                 Age: ${employee.age}
                 Skills:${employee.skills}
                `
        ).join("\n--\n")}`

        return description
    }

    async _call(input: z.infer<typeof this.schema>): Promise<string> {
        const { employeeId } = input

        const bestEmployee = this.employees.find(e => e.id === +employeeId)

        if (!bestEmployee) {
            throw new Error(
                `Employee Id ${employeeId} not found in list of Employees: 
                  ${this.employees.map(a => a.id).join(", ")}
                  `
            )
        }

        return JSON.stringify(bestEmployee)
    }
}

export async function selectEmployee(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { query, employees } = state

    if (employees === null || employees.length === 0) {
        throw new Error("No Employees passed to select_employee node")
    }

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `You are an expoert recruter, helping to select the best Employee Id for their query.
             Given their query, use the 'Select_EmployeeId' tool to select the best Employee Id for
             the query.
            `
        ],
        ["human", `Query: {query}`]
    ]);

    const tool = new SelectEmployeeTool(employees, query as any);

    const modelWithTools = llm.withStructuredOutput(tool)

    const chain = prompt.pipe(modelWithTools).pipe(tool)

    const response = await chain.invoke({
        query
    })

    const bestEmployee: EmployeeProfile = JSON.parse(response)

    return {
        bestEmployee
    }
}