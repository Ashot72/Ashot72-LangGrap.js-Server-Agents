import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages"
import { HumanResponse } from "@langchain/langgraph/prebuilt"

export type Email = {
    subject: string;
    content: string
}

export type EmployeeProfile = {
    id: number; // Unique Id
    category: string; // Represents the category or specialization of the employee
    fullName: string; // Full name of the employee
    phone: string; // Phone number in international format
    email: string; // Email address of the employee
    skills: string; // Description of skills and experience
    age: number; // Age of the employee
}

export const JobNotificationAnnotation = Annotation.Root({
    query: Annotation<BaseMessage[]>,
    categories: Annotation<string[] | null>,
    employees: Annotation<EmployeeProfile[] | null>,
    skippedEmployeeIds: Annotation<number[] | null>,
    bestEmployee: Annotation<EmployeeProfile | null>,
    email: Annotation<Email>,
    emailSent: Annotation<string>,

    humanResponse: Annotation<HumanResponse | undefined>
})
export type JobNotificationAnnotationState = typeof JobNotificationAnnotation.State
export type JobNotificationAnnotationUpdate = typeof JobNotificationAnnotation.Update