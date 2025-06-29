import { QAndAItem } from "./q-and-a-item"

const mockQuestions = [
  {
    id: 1,
    question: "Please describe your company's approach to data security and privacy.",
    compliance: "passed",
  },
  {
    id: 2,
    question: "What is your customer support model and what are the associated SLAs?",
    compliance: "pending",
  },
  {
    id: 3,
    question: "Provide a detailed breakdown of the pricing structure for your solution.",
    compliance: "failed",
  },
]

export function QAndAList() {
  return (
    <div className="space-y-4">
      {mockQuestions.map((q) => (
        <QAndAItem
          key={q.id}
          id={q.id}
          question={q.question}
          compliance={q.compliance as any}
        />
      ))}
    </div>
  )
}
