import { useState } from 'react';

// Learning content organized by module
const LEARNING_MODULES = {
  cla: {
    title: 'Constraints-Led Approach',
    icon: '🎯',
    color: 'blue',
    description: 'The science behind effective skill development',
    lessons: [
      {
        id: 'cla_intro',
        title: 'What is CLA?',
        duration: '5 min',
        content: `
## Constraints-Led Approach (CLA)

The Constraints-Led Approach is a motor learning framework based on **ecological dynamics**. Instead of telling students exactly what to do, we create environments where the right movements naturally emerge.

### The Old Way vs CLA

**Traditional Teaching:**
> "When they do X, you do Y. Put your hand here, shift your weight there."

**CLA Teaching:**
> "Your goal is to sweep them. Their goal is to pass. Figure it out."

### Why CLA Works

1. **Problem-Solving** - Students develop their own solutions that work for their body
2. **Adaptability** - They learn to read situations, not just execute techniques
3. **Retention** - Self-discovered skills stick better than prescribed ones
4. **Transfer** - Skills transfer to live rolling because they learned under realistic conditions

### The Three Constraints

CLA manipulates three types of constraints:

| Constraint | Examples |
|-----------|----------|
| **Task** | Rules, goals, equipment, scoring |
| **Environment** | Space, time, partners, fatigue |
| **Performer** | Skill level, size, flexibility |

### Key Principle

> "Don't coach the movement. Coach the environment, and let the movement emerge."

When you create the right game with the right constraints, students discover solutions you might never have thought to teach them.
        `
      },
      {
        id: 'cla_constraints',
        title: 'Designing Constraints',
        duration: '8 min',
        content: `
## How to Design Effective Constraints

Good constraints **guide without prescribing**. They create problems that have solutions, but don't dictate what those solutions must be.

### Constraint Design Principles

#### 1. Start with the Problem
Ask: "What do I want students to learn to DO?" Not what technique - what capability.

❌ "I want them to learn the scissor sweep"
✅ "I want them to learn to off-balance opponents from closed guard"

#### 2. Create Meaningful Goals
Both players need something to work toward.

**Bad:** "Just try to sweep"
**Good:** "First to 3 sweeps wins. Resets after each."

#### 3. Scale Difficulty with Constraints

**Easier:**
- More time
- More space
- Less resistance
- Fewer options for opponent

**Harder:**
- Time pressure
- Limited space
- Full resistance
- More options for opponent

### Example: Teaching Guard Retention

**Level 1:** Passer can only use knee cut
- Guarder learns to block ONE pass

**Level 2:** Passer chooses knee cut or torreando
- Guarder learns to READ and react

**Level 3:** Full passing allowed, 30 second rounds
- Guarder learns to RECOVER under pressure

### Common Mistakes

❌ **Too many constraints** - Students focus on rules, not learning
❌ **Unrealistic conditions** - Doesn't transfer to rolling
❌ **No clear goal** - Students don't know what success looks like
❌ **Over-coaching** - Jumping in with solutions too quickly

### The Golden Rule

If students are solving the problem, **stay quiet**. Only intervene if they're stuck and frustrated, and even then, ask questions first:

> "What happened when you tried X?"
> "What would happen if you moved your hips first?"
> "Where was their weight when you got swept?"
        `
      },
      {
        id: 'cla_rep_design',
        title: 'Representative Design',
        duration: '6 min',
        content: `
## Representative Design

For learning to transfer to real rolling, practice must be **representative** of real conditions.

### What Makes Practice Representative?

1. **Same information available** - If in rolling you see grips, weight shifts, and angles, practice should include those too
2. **Same time pressure** - Decisions happen fast in rolling
3. **Same consequences** - If you get passed, something meaningful happens
4. **Opponent has real goals** - Not just a dummy feeding techniques

### The Problem with Traditional Drilling

**Static drilling:**
- Partner doesn't resist
- No time pressure
- Reset after each rep
- Only practicing the "technique", not the "when" or "why"

**Result:** Students can do the move in drilling but not in rolling.

### Representative Alternatives

| Instead of... | Try... |
|--------------|--------|
| Static armbar drilling | Armbar game: sweep or submit in 30 sec |
| Pass drilling on unresisting partner | Passing game with guard retention goals |
| Escape drilling from static positions | Survival rounds starting in bad spots |

### The Transfer Test

Ask yourself: **"Would this situation happen in rolling?"**

If your students never encounter the exact scenario you're drilling, they're not learning to recognize opportunities.

### Example: Teaching Triangles

**Low Representative:**
Partner gives their arm, you set up triangle step by step

**High Representative:**
Closed guard game where you get points for:
- Submitting
- Achieving triangle position (even if they defend)
- Breaking posture

Student learns:
- When triangles are available
- How to create the opening
- How to adjust when it's defended
        `
      },
      {
        id: 'cla_variability',
        title: 'Variability in Practice',
        duration: '5 min',
        content: `
## Why Variability Beats Repetition

Doing the same thing over and over feels productive but **variable practice** produces better learning.

### The Research

Studies show that practicing skills under varying conditions leads to:
- Better retention
- Better transfer to new situations
- More adaptable performers

### Types of Variability

#### 1. Contextual Variability
Different positions, different partners, different starting points

> Instead of: 100 armbars from guard
> Try: Armbars from guard, mount, side control in random order

#### 2. Constraint Variability
Same skill, different rules

> Guard passing with:
> - Only knee cut allowed
> - No grips on legs
> - Must pass in 20 seconds
> - Partner can only frame (no grips)

#### 3. Outcome Variability
Same start, different goals

> From closed guard:
> - Round 1: Sweep only
> - Round 2: Submit only
> - Round 3: Your choice

### The Variability Warning

**Don't repeat the same game every class.**

If you run "Guard Retention" every Tuesday, students optimize for *that game*, not guard retention in general.

Vary:
- The position
- The constraints
- The time
- The partner
- The goal

### Practical Application

| Week 1 | Week 2 | Week 3 |
|--------|--------|--------|
| Guard retention vs standing passer | Guard retention vs kneeling passer | Guard retention with sweeps allowed |
| No grips allowed | Full grips | Only collar grips |
| 2 minute rounds | 30 second rounds | Until pass |

Same skill focus. Different learning experiences.
        `
      }
    ]
  },
  pedagogy: {
    title: 'Teaching Methods',
    icon: '📚',
    color: 'green',
    description: 'How to coach effectively without over-coaching',
    lessons: [
      {
        id: 'pedagogy_questioning',
        title: 'Questioning Over Telling',
        duration: '5 min',
        content: `
## The Power of Questions

The best coaches ask more than they tell. Questions activate thinking. Instructions bypass it.

### Why Questions Work

When you tell a student what to do:
- They execute (maybe)
- They forget quickly
- They depend on you

When you ask a question:
- They have to think
- They own the solution
- They can self-correct later

### Question Types for Coaching

#### 1. Attention-Directing Questions
Draw focus to important information:

> "Where was their weight when you got swept?"
> "What did you notice about their grip?"
> "When did you feel unstable?"

#### 2. Problem-Solving Questions
Encourage solution-finding:

> "What could you try differently?"
> "What worked? What didn't?"
> "How might you prevent that next time?"

#### 3. Perception Questions
Develop awareness:

> "What tells you they're about to pass?"
> "How do you know they're setting up an armbar?"
> "What changes when they get tired?"

### When to Tell vs Ask

**Ask when:**
- Student is working through a problem
- They have the skills but aren't applying them
- You want to develop thinking

**Tell when:**
- Safety issue
- Completely stuck and frustrated
- Introducing brand new concept

### The 10-Second Rule

When a student struggles, wait 10 seconds before intervening. Often they figure it out themselves. If you jump in, you steal that learning moment.
        `
      },
      {
        id: 'pedagogy_feedback',
        title: 'Effective Feedback',
        duration: '6 min',
        content: `
## Feedback That Actually Helps

Most coaching feedback is well-intentioned but ineffective. Here's how to give feedback that creates change.

### The Feedback Problem

**Too much feedback:**
- Overwhelms students
- Creates dependency
- Prevents self-discovery

**Too little feedback:**
- Students practice errors
- Don't know what to improve
- Lose motivation

### The Goldilocks Zone

Give feedback that is:
- **Specific** - Not "good job" but "your hip angle created space"
- **Timely** - Close to the attempt, but not interrupting
- **Actionable** - They know what to try next
- **Sparse** - Less than you think you need

### Feedback Timing

| When | Type | Example |
|------|------|---------|
| During | Only safety issues | "Careful of the neck" |
| Between rounds | Brief, actionable | "Try leading with your hips" |
| End of session | Reflective | "What felt different today?" |

### The Sandwich is Dead

Forget "compliment-critique-compliment." It's transparent and wastes time.

Instead: **One thing to keep, one thing to change.**

> "Your pressure was excellent. Next round, try starting your pass earlier."

### Bandwidth Feedback

Only give feedback when performance is outside acceptable range.

If they're doing okay: **Say nothing.** Let them self-organize.
If they're way off: **One cue.** Not five.

### Self-Assessment First

Before giving feedback, ask:

> "How did that feel?"
> "What would you do differently?"
> "Rate that attempt 1-10."

Often students know what went wrong. Your job is to help them notice, not to notice for them.
        `
      },
      {
        id: 'pedagogy_progressions',
        title: 'Building Progressions',
        duration: '7 min',
        content: `
## Progressive Skill Development

Learning is a journey, not a destination. Good progressions guide students through increasing complexity.

### The Progression Principle

Start where they can succeed, then gradually increase challenge.

**Too easy:** No learning (bored)
**Too hard:** No learning (frustrated)
**Just right:** Challenged but successful

### How to Build Progressions

#### 1. Simplify First
Strip the skill to its core:

Full skill: Armbar from closed guard
Simplified: Break posture and control arm (no finish)

#### 2. Add One Thing at a Time

Level 1: Control the arm
Level 2: Control arm + hip escape
Level 3: Full armbar, no resistance
Level 4: Partner defends posture only
Level 5: Partner defends everything

#### 3. Increase Resistance Gradually

| Level | Resistance |
|-------|------------|
| 1 | Cooperative |
| 2 | Light resistance |
| 3 | Full resistance, limited options |
| 4 | Full resistance, full options |
| 5 | Live rolling |

### Progression Through Constraints

Instead of changing the technique, change the game:

**Guard Passing Progression:**

1. Passer vs stationary guard (learn mechanics)
2. Passer vs framing only (add obstacle)
3. Passer vs full retention (add pressure)
4. Passer vs sweeps allowed (add consequences)
5. Full sparring (full context)

### Signs to Progress

✅ Consistent success (70%+)
✅ Students asking for more challenge
✅ Technique looks smooth, not forced
✅ Students solving problems independently

### Signs to Regress

❌ Consistent failure
❌ Frustration or disengagement
❌ Reverting to bad habits
❌ Unable to self-correct
        `
      }
    ]
  },
  psychology: {
    title: 'Learning Psychology',
    icon: '🧠',
    color: 'purple',
    description: 'How people actually learn motor skills',
    lessons: [
      {
        id: 'psych_stages',
        title: 'Stages of Learning',
        duration: '5 min',
        content: `
## The Three Stages of Motor Learning

Understanding where students are in their learning helps you coach appropriately.

### Stage 1: Cognitive (Beginner)

**What's happening:**
- Learning what to do
- Lots of thinking
- Inconsistent, jerky movements
- High error rate
- Easily overwhelmed

**How to coach:**
- Simple, clear instructions
- Limit choices
- Focus on one thing at a time
- Lots of success (easy games)
- Don't over-correct

### Stage 2: Associative (Intermediate)

**What's happening:**
- Refining movements
- More consistent
- Starting to self-correct
- Can handle more complexity
- Mistakes become more subtle

**How to coach:**
- Ask more questions
- Introduce variability
- Add decision-making
- Challenge with constraints
- Less frequent feedback

### Stage 3: Autonomous (Advanced)

**What's happening:**
- Automatic execution
- Attention freed for strategy
- Self-correcting
- Adaptable to contexts
- Smooth, efficient movements

**How to coach:**
- Problem-based challenges
- Competition simulation
- Random practice
- Minimal intervention
- Focus on perception and strategy

### Coaching Mismatch Problems

| Coach Does | Beginner | Advanced |
|-----------|----------|----------|
| Too much detail | Overwhelmed, confused | Bored, over-thinks |
| Too little structure | Lost, frustrated | Fine, self-directs |
| Too easy games | Bored (brief) | Very bored |
| Too hard games | Frustrated, gives up | Challenged, grows |

### Key Insight

**Beginners need success. Advanced need challenge.**

Adjust your games and coaching based on where students actually are, not where you think they should be.
        `
      },
      {
        id: 'psych_motivation',
        title: 'Motivation & Engagement',
        duration: '5 min',
        content: `
## Keeping Students Engaged

Skill development requires repetition. Repetition can be boring. Games make repetition engaging.

### Self-Determination Theory

People are motivated when they have:

1. **Autonomy** - Some control over what they do
2. **Competence** - Feeling capable and improving
3. **Relatedness** - Connection with others

### Designing for Motivation

#### Autonomy
- Let students choose which game
- Multiple ways to "win"
- Freedom in how they solve problems

#### Competence
- Games they can succeed at
- Clear progress markers
- Celebration of improvement

#### Relatedness
- Partner-based games
- Team challenges
- Shared goals

### The Flow State

Optimal engagement happens when challenge matches skill:

\`\`\`
HIGH CHALLENGE + LOW SKILL = Anxiety
LOW CHALLENGE + HIGH SKILL = Boredom
MATCHED CHALLENGE + SKILL = Flow
\`\`\`

**Your job:** Adjust constraints to keep students in flow.

### Gamification in Training

Why games work:
- Clear goals
- Immediate feedback
- Consequences for actions
- Social comparison
- Fun!

### Warning Signs of Disengagement

- Standing around between rounds
- Going through motions
- Chatting instead of working
- "Are we done soon?"
- Not asking questions

**Solution:** Increase challenge, add stakes, or change the game entirely.
        `
      }
    ]
  },
  practical: {
    title: 'Practical Application',
    icon: '🔧',
    color: 'orange',
    description: 'Putting theory into practice',
    lessons: [
      {
        id: 'practical_session',
        title: 'Structuring a Session',
        duration: '6 min',
        content: `
## Building an Effective Training Session

A well-structured session has a rhythm: warmup → build → peak → cool down.

### Session Template (60 min)

| Phase | Time | Purpose | Energy |
|-------|------|---------|--------|
| Warmup | 10 min | Movement prep, low stakes | Low → Medium |
| Skill intro | 5 min | Context setting | Medium |
| Game block 1 | 15 min | Main skill focus | High |
| Game block 2 | 15 min | Variation or progression | High |
| Live training | 10 min | Integration | Peak |
| Cool down | 5 min | Q&A, reflection | Low |

### Warmup Games

**Goal:** Get moving, low cognitive load

Examples:
- Guard retention flow (no submissions)
- Sweep-only rounds
- Movement games (no submission allowed)

### Main Block

**Goal:** Targeted skill development

- Clear objective
- Appropriate challenge
- Multiple rounds
- Brief feedback between

### Progressions Within Session

**Round 1-2:** Learn the game, find strategies
**Round 3-4:** Refine, add intensity
**Round 5-6:** Peak challenge

### Live Training Integration

After games, let students roll with focus:

> "For the next 10 minutes, try to use what we worked on. I'll be watching for [specific thing]."

### Cool Down

Don't just end. Create reflection:

> "What worked today?"
> "What will you try next time?"
> "Any questions?"

### Common Mistakes

❌ **No warmup** → Injuries, slow start
❌ **Too many games** → Nothing gets developed
❌ **No live training** → Skills don't transfer
❌ **Abrupt ending** → Missed learning opportunity
        `
      },
      {
        id: 'practical_troubleshoot',
        title: 'Troubleshooting Common Issues',
        duration: '5 min',
        content: `
## When Things Aren't Working

Even good games fail sometimes. Here's how to diagnose and fix problems.

### "Students aren't improving"

**Check:**
- Is the game too easy? (No challenge)
- Is the game too hard? (No success)
- Is there enough repetition?
- Are you over-coaching?

**Try:**
- Adjust constraints
- Reduce complexity
- Give more time
- Step back and observe

### "The game is one-sided"

**Check:**
- Are constraints balanced?
- Does one role have clearer goal?
- Skill mismatch between partners?

**Try:**
- Handicap the winning side
- Swap roles more often
- Adjust goals (winner gets harder task)
- Pair by skill level

### "Students look bored"

**Check:**
- Is it too easy?
- Have you run this game too often?
- No meaningful stakes?

**Try:**
- Add time pressure
- Add scoring/competition
- Change a constraint
- Let them suggest variations

### "It's too chaotic"

**Check:**
- Too many rules?
- Unclear goals?
- Too much freedom?

**Try:**
- Simplify the game
- Demo one round
- Start with one constraint, add more
- Pause and clarify

### "Skills don't transfer to rolling"

**Check:**
- Is the game representative?
- Does it include decision-making?
- Is there enough resistance?

**Try:**
- Add more realistic conditions
- Include opponent choices
- Remove artificial restrictions
- End with focused live training

### The Ultimate Fix

When in doubt: **Ask students what's not working.**

They often know exactly what the problem is.
        `
      }
    ]
  }
};

export default function Learn() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(() => {
    const saved = localStorage.getItem('completed_lessons');
    return saved ? JSON.parse(saved) : [];
  });

  // Save completed lessons
  const markComplete = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      const updated = [...completedLessons, lessonId];
      setCompletedLessons(updated);
      localStorage.setItem('completed_lessons', JSON.stringify(updated));
    }
  };

  // Calculate module progress
  const getModuleProgress = (moduleKey) => {
    const module = LEARNING_MODULES[moduleKey];
    const completed = module.lessons.filter(l => completedLessons.includes(l.id)).length;
    return { completed, total: module.lessons.length };
  };

  // Color mappings
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      progress: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      progress: 'bg-green-500'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      progress: 'bg-purple-500'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      progress: 'bg-orange-500'
    }
  };

  // Render lesson content with markdown-like formatting
  const renderContent = (content) => {
    const lines = content.trim().split('\n');
    const elements = [];
    let inTable = false;
    let tableRows = [];
    let inCodeBlock = false;
    let codeContent = [];

    lines.forEach((line, index) => {
      // Code block
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm my-3">
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Table
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        if (!line.includes('---')) {
          tableRows.push(line.split('|').filter(cell => cell.trim()).map(cell => cell.trim()));
        }
        return;
      } else if (inTable) {
        elements.push(
          <div key={`table-${index}`} className="overflow-x-auto my-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {tableRows[0]?.map((cell, i) => (
                    <th key={i} className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 text-gray-600 dark:text-gray-400">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }

      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      // Blockquote
      else if (line.startsWith('>')) {
        elements.push(
          <blockquote key={index} className="border-l-4 border-primary-500 pl-4 py-1 my-3 text-gray-600 dark:text-gray-400 italic">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // Bold/emphasis line
      else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={index} className="font-semibold text-gray-800 dark:text-gray-200 my-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      // List items
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={index} className="ml-4 text-gray-600 dark:text-gray-400 list-disc">
            {line.replace(/^[\s]*[-*]\s/, '')}
          </li>
        );
      }
      // Numbered list
      else if (/^\d+\./.test(line.trim())) {
        elements.push(
          <li key={index} className="ml-4 text-gray-600 dark:text-gray-400 list-decimal">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Regular paragraph
      else if (line.trim()) {
        // Handle inline formatting
        let text = line;
        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>');

        elements.push(
          <p
            key={index}
            className="text-gray-600 dark:text-gray-400 my-2"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      }
    });

    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-3xl">📖</span>
          Learn
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Master the science of coaching with CLA and effective pedagogy
        </p>
      </div>

      {/* Back button when viewing lesson */}
      {selectedLesson && (
        <button
          onClick={() => setSelectedLesson(null)}
          className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to {selectedModule ? LEARNING_MODULES[selectedModule].title : 'modules'}
        </button>
      )}

      {/* Module list */}
      {!selectedModule && !selectedLesson && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(LEARNING_MODULES).map(([key, module]) => {
            const progress = getModuleProgress(key);
            const colors = colorClasses[module.color];

            return (
              <button
                key={key}
                onClick={() => setSelectedModule(key)}
                className={`card p-4 text-left hover:shadow-lg transition-shadow border-2 ${colors.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}>
                    {module.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {module.description}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{progress.completed}/{progress.total} lessons</span>
                        <span className={colors.text}>{Math.round((progress.completed / progress.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className={`h-full ${colors.progress} rounded-full transition-all`}
                          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lesson list for selected module */}
      {selectedModule && !selectedLesson && (
        <div className="space-y-3">
          {LEARNING_MODULES[selectedModule].lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const colors = colorClasses[LEARNING_MODULES[selectedModule].color];

            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className="w-full card p-4 text-left hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 dark:bg-green-900/30' : colors.bg
                  }`}>
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`font-semibold ${colors.text}`}>{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {lesson.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lesson.duration} read
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedModule(null)}
            className="w-full py-3 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to all modules
          </button>
        </div>
      )}

      {/* Lesson content */}
      {selectedLesson && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedLesson.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedLesson.duration} read
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {renderContent(selectedLesson.content)}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setSelectedLesson(null)}
              className="btn-secondary"
            >
              ← Back to lessons
            </button>

            {!completedLessons.includes(selectedLesson.id) ? (
              <button
                onClick={() => markComplete(selectedLesson.id)}
                className="btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Mark as Complete
              </button>
            ) : (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
