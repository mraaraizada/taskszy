import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    id: 1,
    question: "Who is TasksZy designed for?",
    answer: "TasksZy is built for agencies, startups, growing businesses, organizations, remote teams, freelancers, and content creators who need a centralized platform to manage projects, teams, budgets, and performance."
  },
  {
    id: 2,
    question: "How is TasksZy different from traditional project management tools?",
    answer: "Unlike traditional task managers, TasksZy combines project management, team collaboration, budgets monitoring, documentation, and reporting into a single workspace, eliminating the need for multiple disconnected tools."
  },
  {
    id: 3,
    question: "Can I manage remote or distributed teams?",
    answer: "Yes. TasksZy is designed for modern teams, allowing members to collaborate, communicate, update tasks, and stages from anywhere in the world."
  },
  {
    id: 4,
    question: "Does TasksZy support role-based permissions?",
    answer: "Yes. You can create custom roles and control access for administrators, managers, team leads, employees, freelancers, and contractors to ensure secure collaboration."
  },
  {
    id: 5,
    question: "Is there a limit to how many team members I can add?",
    answer: "TasksZy is built to scale with your organization. Plans are available for small teams, growing businesses, and larger organizations with advanced collaboration requirements."
  },
  {
    id: 6,
    question: "Is TasksZy suitable for YouTubers and content creation teams?",
    answer: "Absolutely. Content creators can plan content calendars, manage work, assign tasks, collaborate with team members, and organize assets in one place."
  },
  {
    id: 7,
    question: "How do I get started?",
    answer: "Simply create an account, set up your workspace, invite your team, and start managing projects, tasks, budgets, and performance from one unified platform."
  }
]

export default function FAQ() {
  const [openId, setOpenId] = useState(null)

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="faqs" className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-accent font-body mb-3 tracking-wide uppercase">
            Frequently Asked Questions
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1]">
            Everything You Need to Know
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Common questions about TasksZy
          </p>
        </motion.div>

        {/* FAQ Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-100 rounded-[26px] p-2 border border-gray-300">
            <div className="space-y-2">
            {faqs.map((faq) => (
              <motion.div
                key={faq.id}
                className="bg-white rounded-3xl overflow-hidden"
                layout
                transition={{
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-primary/5 transition-colors"
                >
                  <span className="text-black text-xl font-normal pr-4">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {openId === faq.id ? (
                        <path
                          d="M5 12H19"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : (
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: {
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1]
                        },
                        opacity: {
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1]
                        }}
                        className="px-8 pb-6 pt-2"
                      >
                        <p className="text-gray-700 text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
