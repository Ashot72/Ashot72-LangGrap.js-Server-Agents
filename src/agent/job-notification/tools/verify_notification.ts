import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt"
import { interrupt } from "@langchain/langgraph"
import { Email, JobNotificationAnnotationState, JobNotificationAnnotationUpdate } from "../types";

export async function verifyNotification(state: JobNotificationAnnotationState):
    Promise<Partial<JobNotificationAnnotationUpdate>> {

    const { email } = state

    const description = `Would you like to send an email to the best-fit candidate? If so, check the box; 
                         otherwise, leave it unchecked.\n\n
    ${email.subject}\n\n
    ${email.content}\n`;

    console.log('Entering "Verify Notification" interrupt handler')

    const res = interrupt<HumanInterrupt[], HumanResponse[]>([
        {
            action_request: {
                action: "Verify Notification",
                args: {
                    ...state.email
                }
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

    console.log('"Verify Notification" interrupt handler:"', JSON.stringify(res, null, 2))

    if (["ignore", "response", "accept"].includes(res.type)) {
        return {
            humanResponse: res
        }
    }

    if (!["edit"].includes(res.type)) {
        throw new Error('The response type should be either "ignore", "response", "accept", or "edit"')
    }

    if (
        typeof res.args !== "object" ||
        !res.args ||
        typeof res.args.args !== "object" ||
        !("subject" in res.args.args) ||
        !("content" in res.args.args)
    ) {
        throw new Error(
            `If response is "edit", args must be an object with 'subject' and 'content' fields`
        )
    }

    const { subject, content } = res.args.args as Email

    return {
        email: {
            subject,
            content
        },
        humanResponse: res
    }
}