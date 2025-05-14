import fs from "fs"
import * as path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { END, START, StateGraph } from "@langchain/langgraph";
import { extractCategories } from "./tools/extract_categories"
import { selectEmployee } from "./tools/select_employee"
import {
  EmployeeProfile,
  JobNotificationAnnotation,
  JobNotificationAnnotationState,
  JobNotificationAnnotationUpdate
} from "./types";
import { verifyEmployee } from "./tools/verify_employee";;
import { generateEmail } from "./tools/generate_email";
import { sendNotification } from "./tools/send_notification";
import { verifyNotification } from "./tools/verify_notification";

export const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo",
  temperature: 0
})

async function retrieveEmployees(state: JobNotificationAnnotationState):
  Promise<Partial<JobNotificationAnnotationUpdate>> {

  const { categories, skippedEmployeeIds } = state

  if (!categories || categories.length === 0) {
    throw new Error("No categories passed to retrieve_employees node")
  }

  const allEmployees: EmployeeProfile[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, './data/candidates.json'), "utf-8")
  )

  let employees = categories.map(c => allEmployees.filter(d => d.category === c)).flat()

  if (skippedEmployeeIds && skippedEmployeeIds.length > 0) {
    employees = employees.filter(e => !skippedEmployeeIds.includes(e.id))
  }

  return {
    employees
  }
}

function shouldNotifyEmployee(state: JobNotificationAnnotationState):
  "retrieve_employees" | "generate_email" | typeof END {

  const responseType = state.humanResponse?.type

  if (!responseType || responseType === "ignore") {
    return END
  }

  if (responseType === "response") {
    return "retrieve_employees"
  }

  return "generate_email"
}

function shouldSendEmail(state: JobNotificationAnnotationState):
  "generate_email" | "send_notification" | typeof END {

  const responseType = state.humanResponse?.type

  if (!responseType || responseType === "ignore") {
    return END
  }

  if (responseType === "response") {
    return "generate_email"
  }

  return "send_notification"
}

const graph = new StateGraph(JobNotificationAnnotation)
  .addNode("extract_categories", extractCategories)
  .addNode("retrieve_employees", retrieveEmployees)
  .addNode("select_employee", selectEmployee)
  .addNode("verify_employee", verifyEmployee)
  .addNode("generate_email", generateEmail)
  .addNode("verify_notification", verifyNotification)
  .addNode("send_notification", sendNotification)
  .addEdge(START, "extract_categories")
  .addEdge("extract_categories", "retrieve_employees")
  .addEdge("retrieve_employees", "select_employee")
  .addEdge("select_employee", "verify_employee")
  .addConditionalEdges("verify_employee", shouldNotifyEmployee)
  .addEdge("generate_email", "verify_notification")
  .addConditionalEdges("verify_notification", shouldSendEmail)
  .addEdge("send_notification", END)

export const agent = graph.compile()
agent.name = "Job Notification Agent"

/*

//query
We are looking for an experienced web designer with expertise in Drupal and WordPress, as well as agile leadership

// *** verify employee ***

//select a new employee
[{
  "type": "response",
  "args": null
}]

//END
[{
  "type": "ignore",
  "args": null
}]

//Accept the current employee
[{
  "type": "accept",
  "args": null
}]


// *** verify notificaiotn ***

//generate a new email
[{
  "type": "response",
  "args": null
}]

//END
[{
  "type": "ignore",
  "args": null
}]

//Accept the current email
[{
  "type": "accept",
  "args": null
}]

//Edit the current email
[
  {
    "type": "edit",
    "args": {
      "action": "New Email Draft",
      "args": {
        "subject": "subject ...",
        "content": "content ..."
      }
    }
  }
]

*/

