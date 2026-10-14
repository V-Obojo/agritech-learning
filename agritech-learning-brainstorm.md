# Agriculture Learning Product — Brainstorm Record

This document records the product discussion so far. It starts with the full product vision and then describes the narrower version planned for the hackathon.

**How to read the labels**

| Label | Meaning |
|---|---|
| **Agreed** | Decided in discussion. Treat as fixed unless revisited. |
| **Proposed default** | A working assumption for the prototype. Can change without reopening the vision. |
| **Future possibility** | In scope for the long-term product, out of scope for the hackathon. |
| **Open** | A decision still needed. |

---

## Part 1: The complete product vision

### Problem — Agreed

Beginners who are interested in agriculture face three obstacles:

1. **Scattered information.** Guidance is spread across videos, forums, extension leaflets and word of mouth, with no clear order and uneven reliability.
2. **Uncertainty about starting.** It is hard to know whether an activity suits your circumstances, or what to do first.
3. **Difficulty sustaining practical learning.** Without structure, feedback or help when stuck, early interest fades before it becomes informed practice.

### Audience — Agreed (in priority order)

1. **People exploring agriculture.** Curious, with no commitment yet.
   *Example:* a city worker who keeps seeing fish-farming videos and wants to know whether it is realistic.
2. **People preparing to start.** They have decided to try and need to get ready.
   *Example:* someone with access to family land planning a first small project.
3. **Agriculture students connecting theory with practice.**
   *Example:* a student who knows water chemistry from lectures but has never assessed a real site.

### Positioning — Agreed

A **learning companion** that welcomes curiosity and supports progression toward informed agricultural practice. It does not pressure anyone to start farming; it helps people learn enough to make a good decision.

### Challenge alignment — Agreed

- **Lead:** Track 2.
- **Supporting:** resource discovery and pathways to opportunity.

### Learner journey — Agreed

```
Explore → Learn the basics → Decide if it suits me → Prepare → Learn through a first cycle
```

The learner can stop at any stage. Each stage should leave them better informed than before.

### Exploration experience — Agreed

- Short lessons
- Questions to check understanding
- Fictional decision scenarios (for example, "Ada has a borehole shared with three households — what should she find out first?")
- Documented farm journeys from real practitioners
- Optional observations of the learner's own surroundings

**Principle:** a visitor can finish a useful session without committing to farming.

### Continued engagement — Agreed

- Manageable activities sized for a short session
- Saved progress
- Feedback on activities
- Help when stuck
- Optional reminders
- A clear next step at the end of every session

**Principle:** pausing, or deciding against farming, counts as a valid outcome, not a failure.

### Role of AI — Agreed

The AI:

- explains **reviewed** material and cites its sources,
- answers follow-up questions,
- gives feedback on activities,
- suggests suitable next steps **within an authored pathway**.

The AI does not invent the curriculum or the order of learning. People author those.

### Wider possibilities — Future possibility

- Additional crops and animals
- Voice access
- Reviewed translations into local languages
- Peer learning
- Expert support
- Opportunity pathways (training, cooperatives, programmes)

### Operating conditions — Agreed

- **Low bandwidth:** light pages, minimal media by default.
- **Offline learning materials:** core lessons available without a connection.
- **Accessibility:** readable on small screens, clear language, works with assistive technology.
- **Local relevance:** examples, conditions and resources that match the learner's location.
- **Source credibility:** every factual claim traceable to reviewed material.

---

## Part 2: The narrowed hackathon build

### Domain and location — Agreed

**Beginner fish farming in Nigeria.**

### Primary learner — Agreed

Someone curious about fish farming who may have **no experience, no site, no equipment, and no immediate plan to invest**.

### Promise — Agreed

Help the learner:

1. understand the basics,
2. consider whether fish farming suits their circumstances,
3. identify a practical next step.

### Format — Agreed

- Mobile-friendly website
- English content for the initial demonstration

### Core experience — Agreed

One complete learning loop:

1. **Choose an intention** — for example, "I'm just curious", "I'm thinking of starting", "I'm studying agriculture".
2. **Complete a short reviewed lesson.**
3. **Ask the AI a question** about the lesson.
4. **Attempt an activity.**
5. **Receive feedback.**
6. **Continue with saved progress** and a clear next step.

### Demonstration topic — Agreed

**Water availability.** All content comes from expert-reviewed material. The prototype must not invent technical recommendations (for example, specific water-quality thresholds) that are not in the reviewed sources.

### Inclusive activity — Agreed

The learner picks whichever option fits their situation:

| Option | Who it suits | Example output |
|---|---|---|
| **Observe a real water source** | Has access to a possible site | "Well behind the house; dry for about two months last year; shared with neighbours." |
| **List unanswered questions** | Has a site in mind but cannot visit it | "Does the stream flow all year? Who else uses it?" |
| **Use a fictional example** | Has no real-world access | Work through a provided scenario about a fictional plot. |

All three paths receive feedback and count as completing the activity.

### AI boundary — Agreed

- **One** source-grounded guide.
- Learning stages and progression are **explicitly authored**, not generated.
- Answers cite the supporting reviewed material.
- For questions the material does not cover, the guide states the limitation honestly and offers a suitable next step.

*Example of an unsupported question:*
> **Learner:** "What dose of treatment should I use for sick catfish?"
> **Guide:** "The lessons here don't cover fish health treatment, so I can't give a reliable answer. A fisheries extension officer or experienced farmer near you is the right person to ask. Meanwhile, you can continue with the water-availability activity."

### Prototype exclusions — Agreed

- Live diagnosis
- A full farming-cycle curriculum
- Peer groups
- Marketplace features
- Multiple agricultural activities

### Reminder treatment — Agreed

- Demonstrate an **optional** follow-up reminder (the learner opts in and sees what it would look like).
- Live message delivery (SMS, WhatsApp, email) is outside the initial build.

### Prototype defaults — Proposed default

These are working assumptions for the build and can change:

- Progress is saved per learner on the device or a simple account, without requiring sign-up to start.
- The lesson is short enough to finish in one sitting on a phone.
- The guide answers only from the reviewed water-availability material for the demo.

---

## Validation

### What the demo must show — Agreed

- A **complete learning loop**, including a learner **getting stuck and receiving help**.
- A learner **without farm access** can still participate fully (via the questions or fictional-example option).
- AI responses **cite supporting material** and **acknowledge unsupported questions**.

### What to measure — Agreed

- Activity completion
- Understanding (for example, a short check after the lesson)
- Willingness to return

**Note:** long-term retention is **unproven** by a hackathon prototype and should be described that way.

---

## Unresolved questions — Open

These must be decided **before developing agricultural content**:

| Decision | Why it matters |
|---|---|
| **Fish species** (for example, catfish or tilapia) | Water needs and examples differ by species. |
| **Nigerian locality** | Water availability, seasons and local resources vary by region. |
| **Reviewed sources** | The guide may only answer from material an expert has reviewed. |
| **Interview findings** | Conversations with beginners and farmers should shape the lesson and activity. |
