const messagesEl = document.querySelector("#messages");
const quickRepliesEl = document.querySelector("#quickReplies");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#chatInput");
const resetButton = document.querySelector("#resetChat");
const submissionStatus = document.querySelector("#submissionStatus");
const leadEmail = "buildwithezra@gmail.com";
const localHosts = ["localhost", "127.0.0.1", "::1", "[::1]"];

const state = {
  step: 0,
  answers: {
    type: "",
    goal: "",
    timeline: "",
    budget: "",
    contact: "",
  },
};

const steps = [
  {
    key: "type",
    question:
      "Hi, I’m Ezra AI. What kind of website are you thinking about?",
    replies: ["Business website", "Portfolio", "Landing page", "Online shop"],
  },
  {
    key: "goal",
    question:
      "Great. What should the website help you do first?",
    replies: ["Get leads", "Book calls", "Sell products", "Show my work"],
  },
  {
    key: "timeline",
    question:
      "What timeline feels right for launch?",
    replies: ["1-2 weeks", "This month", "Flexible", "Not sure yet"],
  },
  {
    key: "budget",
    question:
      "What budget do you have in mind for the project? You can enter a number or range.",
    replies: ["What is a good range?"],
  },
  {
    key: "contact",
    question:
      "Last thing: leave an email or phone number, and I’ll turn this into a clean project brief.",
    replies: [],
  },
];

function addMessage(text, sender = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `message ${sender}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderQuickReplies(replies) {
  quickRepliesEl.innerHTML = "";
  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = reply;
    button.addEventListener("click", () => {
      if (state.step >= steps.length) {
        handlePostBriefReply(reply);
        return;
      }
      handleAnswer(reply);
    });
    quickRepliesEl.appendChild(button);
  });
}

function currentStep() {
  return steps[state.step];
}

function askStep() {
  const step = currentStep();
  if (!step) {
    finishConversation();
    return;
  }
  window.setTimeout(() => {
    addMessage(step.question);
    renderQuickReplies(step.replies);
  }, 260);
}

function handleAnswer(answer) {
  const step = currentStep();
  if (!answer.trim() || !step) return;

  addMessage(answer, "user");

  if (step.key === "budget" && isBudgetGuidanceQuestion(answer)) {
    input.value = "";
    window.setTimeout(() => {
      addMessage(
        "An appropriate budget for a website like this usually ranges from $250 to $750. Send the amount or range you want Ezra to design around, and I’ll include it in the brief."
      );
    }, 260);
    return;
  }

  state.answers[step.key] = answer.trim();
  state.step += 1;
  input.value = "";
  renderQuickReplies([]);
  askStep();
}

function isBudgetGuidanceQuestion(answer) {
  const text = answer.toLowerCase();
  return (
    text.includes("appropriate") ||
    text.includes("recommend") ||
    text.includes("suggest") ||
    text.includes("guidance") ||
    text.includes("good range") ||
    text.includes("not sure") ||
    text.includes("how much") ||
    text.includes("what budget") ||
    text.includes("what should")
  );
}

function recommendPackage() {
  const { type, goal, timeline, budget } = state.answers;
  const fast = timeline.includes("1-2") || timeline.includes("month");
  const numericBudget = Number((budget.match(/\d+/) || ["0"])[0]);
  const premium = numericBudget >= 750 || type === "Online shop";

  if (premium) {
    return "a custom multi-page build with stronger visual direction, conversion copy, and launch QA";
  }

  if (fast || type === "Landing page") {
    return "a focused landing page or compact site that prioritizes speed, clarity, and a strong call to action";
  }

  if (goal === "Show my work") {
    return "a polished portfolio site with case-study sections, a clear story, and simple contact flow";
  }

  return "a clean business website with service pages, trust-building copy, and a direct lead path";
}

function buildBrief() {
  const { type, goal, timeline, budget, contact } = state.answers;

  return `Here’s the project brief I’d send Ezra:\n\nWebsite type: ${type}\nPrimary goal: ${goal}\nTimeline: ${timeline}\nBudget: ${budget}\nBest contact: ${contact}\n\nRecommendation: ${recommendPackage()}.\n\nNext step: Ezra should reply with a scope, estimated timeline, and 2-3 design directions.`;
}

async function submitLead(brief) {
  const contact = state.answers.contact;
  const payload = {
    _subject: "New website project lead",
    _captcha: "false",
    _template: "table",
    email: contact.includes("@") ? contact : "",
    website_type: state.answers.type,
    primary_goal: state.answers.goal,
    timeline: state.answers.timeline,
    budget: state.answers.budget,
    contact,
    project_brief: brief,
  };

  if (localHosts.includes(window.location.hostname)) {
    console.info("Preview lead submission to", leadEmail, payload);
    return { preview: true };
  }

  const response = await fetch(`https://formsubmit.co/ajax/${leadEmail}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Lead form submission failed");
  }

  return { preview: false };
}

function finishConversation() {
  const brief = buildBrief();

  window.setTimeout(async () => {
    addMessage(brief);
    submissionStatus.textContent = "Sending project brief...";

    try {
      const result = await submitLead(brief);
      submissionStatus.textContent = result.preview
        ? `Preview mode: this will email ${leadEmail} after deployment.`
        : "Project brief sent. Ezra will follow up soon.";
    } catch (error) {
      submissionStatus.textContent =
        "Could not send automatically. Please use the email link on this page.";
      console.error(error);
    }

    renderQuickReplies(["Start over", "I want a landing page", "I need a full website"]);
  }, 320);
}

function handlePostBriefReply(reply) {
  if (reply === "Start over") {
    resetChat();
    return;
  }

  addMessage(reply, "user");
  renderQuickReplies(["Start over"]);
  window.setTimeout(() => {
    addMessage(
      "Perfect. Ezra can use that direction to shape the proposal around page count, launch timeline, and the first version of the design."
    );
  }, 260);
}

function resetChat() {
  state.step = 0;
  Object.keys(state.answers).forEach((key) => {
    state.answers[key] = "";
  });
  messagesEl.innerHTML = "";
  submissionStatus.textContent = "";
  renderQuickReplies([]);
  askStep();
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input.value;

  if (state.step >= steps.length) {
    if (/start over/i.test(value)) {
      resetChat();
      return;
    }
    addMessage(value, "user");
    window.setTimeout(() => {
      addMessage(
        "That’s useful context. The strongest next move is to send Ezra this brief and ask for a scoped proposal."
      );
    }, 260);
    input.value = "";
    return;
  }

  handleAnswer(value);
});

quickRepliesEl.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;

  if (state.step >= steps.length && event.target.textContent === "Start over") {
    resetChat();
  }
});

resetButton.addEventListener("click", resetChat);

resetChat();
