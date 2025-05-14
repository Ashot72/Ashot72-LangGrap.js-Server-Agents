import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt"
import { interrupt } from "@langchain/langgraph"
import { JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from "../types"

export async function verifyEmployee(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { bestEmployee, skippedEmployeeIds } = state

    if (bestEmployee === null) {
        throw new Error("No Best Employee found")
    }

    const description = `Would you like to send an email notification to the selected employee to schedule an interview, 
                        or choose another best-fit candidate? If so, check the box; otherwise, leave it unchecked.`

    console.log('Entering "Verify Employee" interrupt handler')

    const res = interrupt<HumanInterrupt[], HumanResponse[]>([
        {
            action_request: {
                action: "Verify Employee",
                args: {
                    ...state.skippedEmployeeIds
                },
            },
            description,
            config: {
                allow_ignore: true,
                allow_respond: true,
                allow_edit: true,
                allow_accept: true
            }
        }
    ])[0]

    console.log('"Verify Employee" interrupt handler:"', JSON.stringify(res, null, 2))

    if (["ignore", "response", "accept", "edit"].includes(res.type)) {
        if (res.type === "response") {
            return {
                skippedEmployeeIds: skippedEmployeeIds ? [...skippedEmployeeIds, bestEmployee.id] : [bestEmployee.id],
                humanResponse: res
            }
        } else {
            return {
                humanResponse: res
            }
        }
    }

    throw new Error('The response type should be either "ignore", "response", "accept", or "edit"')

}