/**
 * Prompt Engineering Tool - Core Engine
 * Analyzes prompts and provides improvement questions based on best practices
 * Extended with comprehensive question bank
 */

// ============================================
// Comprehensive Question Bank
// ============================================

const QUESTION_BANK = [
    // Audience & Intent
    "What is your intended audience for this prompt?",
    "What specific task or goal do you want the AI to accomplish?",
    "What format or structure do you prefer for the response?",
    "Do you need the response to be formal or informal?",
    "What tone should the AI use when responding?",
    "Are there any specific constraints or limitations I should be aware of?",
    "What level of detail do you require in the response?",
    "Should the response include examples or just explanations?",
    "Do you prefer concise answers or comprehensive detailed responses?",
    "What is the context or background information relevant to this prompt?",

    // Content Constraints
    "Are there any topics or areas you specifically want to avoid?",
    "Do you have any preferred sources or references I should consider?",
    "What is your timeline or deadline for this request?",
    "Should I prioritize accuracy over creativity or vice versa?",
    "Are there any specific keywords or phrases you want included?",
    "Do you need citations or references in the response?",
    "What is your familiarity level with this topic?",
    "Should I assume you have prior knowledge or explain everything from basics?",
    "Are there any cultural considerations I should keep in mind?",
    "Do you prefer bullet points, paragraphs, or another format?",

    // Purpose & Goals
    "What is the primary purpose of this prompt - learning, decision-making, or something else?",
    "Should I include pros and cons in my analysis?",
    "Do you need actionable steps or just information?",
    "What is your preferred length for the response?",
    "Are there any specific industries or sectors this relates to?",
    "Should I include visual descriptions or stick to text only?",
    "Do you need current information or historical context as well?",
    "What type of language proficiency should I assume?",
    "Should I translate technical terms or keep them as-is?",
    "Are there any legal or ethical considerations?",

    // Instructional Style
    "Do you need step-by-step instructions or general guidance?",
    "What is the complexity level you're comfortable with?",
    "Should I include alternative approaches or focus on one method?",
    "Do you need real-time data or general information suffices?",
    "Are there specific tools or platforms you're using?",
    "Should I include troubleshooting tips?",
    "What is your experience level with technology?",
    "Do you need cost considerations included?",
    "Should I provide beginner, intermediate, or advanced content?",
    "Are there accessibility requirements I should consider?",

    // Technical Specifications
    "Do you need implementation timelines?",
    "Should I include risk assessments?",
    "What is your budget consideration level?",
    "Do you need vendor recommendations?",
    "Should I include case studies or examples?",
    "Are there regulatory requirements?",
    "Do you need compliance information?",
    "Should I include best practices?",
    "What is your geographic location or market focus?",
    "Do you need local considerations?",

    // Business Context
    "Should I include scalability factors?",
    "Are there environmental concerns?",
    "Do you need sustainability aspects?",
    "Should I include innovation trends?",
    "What is your competitive landscape?",
    "Do you need market analysis?",
    "Should I include future predictions?",
    "Are there seasonal considerations?",
    "Do you need emergency procedures?",
    "Should I include maintenance schedules?",

    // Team & Resources
    "What is your team size consideration?",
    "Do you need training requirements?",
    "Should I include quality control measures?",
    "Are there safety protocols needed?",
    "Do you need certification information?",
    "Should I include testing procedures?",
    "What is your integration complexity level?",
    "Do you need migration strategies?",
    "Should I include backup procedures?",
    "Are there disaster recovery needs?",

    // Metrics & Monitoring
    "Do you need performance metrics?",
    "Should I include monitoring tools?",
    "What is your security requirement level?",
    "Do you need privacy considerations?",
    "Should I include legal disclaimers?",
    "Are there intellectual property concerns?",
    "Do you need licensing information?",
    "Should I include warranty details?",
    "What is your customer support structure?",
    "Do you need user documentation?",

    // Support & Documentation
    "Should I include troubleshooting guides?",
    "Are there multilingual requirements?",
    "Do you need localization adaptations?",
    "Should I include cultural adaptations?",
    "What is your distribution channel?",
    "Do you need marketing considerations?",
    "Should I include sales enablement materials?",
    "Are there partnership opportunities?",
    "Do you need vendor evaluation criteria?",
    "Should I include ROI calculations?",

    // Financial Aspects
    "What is your investment timeframe?",
    "Do you need funding considerations?",
    "Should I include business model options?",
    "Are there revenue stream possibilities?",
    "Do you need pricing strategies?",
    "Should I include competitor analysis?",
    "What is your growth projection?",
    "Do you need expansion opportunities?",
    "Should I include merger and acquisition considerations?",
    "Are there exit strategy implications?",

    // Governance & Compliance
    "Do you need succession planning elements?",
    "Should I include governance structures?",
    "What is your risk tolerance level?",
    "Do you need insurance considerations?",
    "Should I include compliance frameworks?",
    "Are there reporting requirements?",
    "Do you need audit trail considerations?",
    "Should I include documentation standards?",
    "What is your communication preference?",
    "Do you need stakeholder management?",

    // Change Management
    "Should I include change management?",
    "Are there organizational impacts?",
    "Do you need resource allocation?",
    "Should I include budget breakdowns?",
    "What is your project management methodology?",
    "Do you need timeline dependencies?",
    "Should I include milestone tracking?",
    "Are there dependency relationships?",
    "Do you need progress measurement?",
    "Should I include success metrics?",

    // Feedback & Iteration
    "What is your feedback mechanism?",
    "Do you need revision processes?",
    "Should I include approval workflows?",
    "Are there quality gates?",
    "Do you need version control?",
    "Should I include collaboration tools?",
    "What is your decision-making process?",
    "Do you need consensus building?",
    "Should I include conflict resolution?",
    "Are there negotiation strategies?",

    // Contracts & Procurement
    "Do you need contract considerations?",
    "Should I include procurement processes?",
    "What is your supply chain complexity?",
    "Do you need vendor management?",
    "Should I include inventory considerations?",
    "Are there logistics requirements?",
    "Do you need transportation modes?",
    "Should I include storage solutions?",
    "What is your manufacturing process?",
    "Do you need production scheduling?",

    // Operations & Quality
    "Should I include capacity planning?",
    "Are there quality assurance needs?",
    "Do you need equipment specifications?",
    "Should I include maintenance protocols?",
    "What is your research methodology?",
    "Do you need data collection methods?",
    "Should I include sampling techniques?",
    "Are there statistical considerations?",
    "Do you need analysis frameworks?",
    "Should I include reporting formats?",

    // Data & Analytics
    "What is your hypothesis testing approach?",
    "Do you need experimental design?",
    "Should I include control variables?",
    "Are there confounding factors?",
    "Do you need correlation analysis?",
    "Should I include regression models?",
    "What is your significance level?",
    "Do you need confidence intervals?",
    "Should I include p-value considerations?",
    "Are there effect sizes?",

    // Statistical Methods
    "Do you need power analysis?",
    "Should I include sample size calculations?",
    "What is your data visualization preference?",
    "Do you need chart types specified?",
    "Should I include color schemes?",
    "Are there accessibility standards?",
    "Do you need interactive elements?",
    "Should I include dashboard layouts?",
    "What is your database structure?",
    "Do you need query optimization?",

    // Database & Infrastructure
    "Should I include indexing strategies?",
    "Are there backup procedures?",
    "Do you need recovery time objectives?",
    "Should I include disaster recovery?",
    "What is your cloud architecture?",
    "Do you need deployment strategies?",
    "Should I include scaling options?",
    "Are there load balancing needs?",
    "Do you need containerization?",
    "Should I include microservices?",

    // Security & Privacy
    "What is your cybersecurity framework?",
    "Do you need threat modeling?",
    "Should I include vulnerability assessments?",
    "Are there penetration testing needs?",
    "Do you need incident response?",
    "Should I include forensics procedures?",
    "What is your privacy impact assessment?",
    "Do you need data protection measures?",
    "Should I include consent mechanisms?",
    "Are there cookie policies?",

    // Regulatory Compliance
    "Do you need GDPR compliance?",
    "Should I include CCPA considerations?",
    "What is your accessibility standard?",
    "Do you need WCAG compliance?",
    "Should I include screen reader compatibility?",
    "Are there keyboard navigation needs?",
    "Do you need alt text requirements?",
    "Should I include contrast ratios?",
    "What is your content management system?",
    "Do you need SEO optimization?",

    // Content & Marketing
    "Should I include metadata standards?",
    "Are there publishing workflows?",
    "Do you need version history?",
    "Should I include content audits?",
    "What is your social media strategy?",
    "Do you need posting schedules?",
    "Should I include engagement tactics?",
    "Are there brand guidelines?",
    "Do you need crisis communication?",
    "Should I include influencer partnerships?",

    // Email & Automation
    "What is your email marketing approach?",
    "Do you need segmentation strategies?",
    "Should I include automation workflows?",
    "Are there deliverability concerns?",
    "Do you need conversion optimization?",
    "Should I include A/B testing?",
    "What is your customer journey mapping?",
    "Do you need touchpoint analysis?",
    "Should I include persona development?",
    "Are there pain point identifications?",

    // Customer Experience
    "Do you need satisfaction metrics?",
    "Should I include loyalty programs?",
    "What is your retention strategy?",
    "Do you need churn prediction?",
    "Should I include win-back campaigns?",
    "Are there upselling opportunities?",
    "Do you need cross-selling strategies?",
    "Should I include referral programs?",
    "What is your lead generation approach?",
    "Do you need funnel optimization?",

    // Sales & Conversion
    "Should I include conversion rates?",
    "Are there attribution models?",
    "Do you need pipeline management?",
    "Should I include scoring systems?",
    "What is your sales process?",
    "Do you need objection handling?",
    "Should I include closing techniques?",
    "Are there negotiation skills?",
    "Do you need relationship building?",
    "Should I include follow-up strategies?",

    // Product Development
    "What is your product development cycle?",
    "Do you need prototyping phases?",
    "Should I include user testing?",
    "Are there beta launch strategies?",
    "Do you need feature prioritization?",
    "Should I include roadmap planning?",
    "What is your innovation pipeline?",
    "Do you need idea generation methods?",
    "Should I include evaluation criteria?",
    "Are there patent considerations?",

    // R&D & Innovation
    "Do you need R&D investments?",
    "Should I include technology scouting?",
    "What is your competitive intelligence?",
    "Do you need market positioning?",
    "Should I include differentiation strategies?",
    "Are there blue ocean opportunities?",
    "Do you need SWOT analysis?",
    "Should I include PESTEL analysis?",
    "What is your strategic planning horizon?",
    "Do you need scenario planning?",

    // Strategy & Planning
    "Should I include contingency plans?",
    "Are there pivot strategies?",
    "Do you need portfolio management?",
    "Should I include resource allocation?",
    "What is your organizational structure?",
    "Do you need departmental coordination?",
    "Should I include cross-functional teams?",
    "Are there matrix management needs?",
    "Do you need virtual collaboration?",
    "Should I include remote work policies?",

    // HR & Talent
    "What is your talent acquisition strategy?",
    "Do you need recruitment channels?",
    "Should I include employer branding?",
    "Are there diversity initiatives?",
    "Do you need onboarding processes?",
    "Should I include retention strategies?",
    "What is your performance management system?",
    "Do you need KPI frameworks?",
    "Should I include feedback loops?",
    "Are there career development paths?",

    // Training & Development
    "Do you need training programs?",
    "Should I include mentoring systems?",
    "What is your compensation philosophy?",
    "Do you need salary benchmarking?",
    "Should I include incentive structures?",
    "Are there equity considerations?",
    "Do you need benefits packages?",
    "Should I include recognition programs?",
    "What is your corporate culture?",
    "Do you need values alignment?",

    // Culture & Ethics
    "Should I include mission statements?",
    "Are there behavioral expectations?",
    "Do you need code of conduct?",
    "Should I include ethics training?",
    "What is your change management approach?",
    "Do you need communication plans?",
    "Should I include resistance handling?",
    "Are there training requirements?",
    "Do you need timeline adjustments?",
    "Should I include success measurements?",

    // Crisis & Reputation
    "What is your crisis management protocol?",
    "Do you need escalation procedures?",
    "Should I include stakeholder notifications?",
    "Are there media relations?",
    "Do you need damage control?",
    "Should I include business continuity?",
    "What is your reputation management?",
    "Do you need brand monitoring?",
    "Should I include sentiment analysis?",
    "Are there review responses?",

    // Public Relations
    "Do you need influencer relations?",
    "Should I include community management?",
    "What is your public relations strategy?",
    "Do you need press release templates?",
    "Should I include media kits?",
    "Are there spokesperson training?",
    "Do you need event planning?",
    "Should I include speaking opportunities?",
    "What is your thought leadership approach?",
    "Do you need content creation?",

    // Professional Development
    "Should I include publishing venues?",
    "Are there conference presentations?",
    "Do you need white paper development?",
    "Should I include expert positioning?",
    "What is your networking strategy?",
    "Do you need industry associations?",
    "Should I include professional groups?",
    "Are there mentorship opportunities?",
    "Do you need partnership building?",
    "Should I include collaboration projects?",

    // Personal Development
    "What is your personal development plan?",
    "Do you need skill assessments?",
    "Should I include learning paths?",
    "Are there certification goals?",
    "Do you need time management?",
    "Should I include productivity tools?",
    "What is your work-life balance approach?",
    "Do you need boundary setting?",
    "Should I include stress management?",
    "Are there wellness considerations?",

    // Life Planning
    "Do you need vacation planning?",
    "Should I include hobby integration?",
    "What is your financial planning horizon?",
    "Do you need budget tracking?",
    "Should I include investment strategies?",
    "Are there retirement considerations?",
    "Do you need tax optimization?",
    "Should I include estate planning?",
    "What is your health management approach?",
    "Do you need preventive care?",

    // Health & Wellness
    "Should I include fitness routines?",
    "Are there nutrition considerations?",
    "Do you need mental health support?",
    "Should I include healthcare providers?",
    "What is your relationship management style?",
    "Do you need communication skills?",
    "Should I include conflict resolution?",
    "Are there trust-building exercises?",
    "Do you need empathy development?",
    "Should I include active listening?",

    // Learning & Memory
    "What is your learning style preference?",
    "Do you need visual aids?",
    "Should I include hands-on practice?",
    "Are there auditory learning needs?",
    "Do you need reading materials?",
    "Should I include interactive elements?",
    "What is your memory enhancement strategy?",
    "Do you need mnemonics?",
    "Should I include repetition schedules?",
    "Are there association techniques?",

    // Focus & Creativity
    "Do you need spaced learning?",
    "Should I include recall practice?",
    "What is your focus improvement method?",
    "Do you need environment optimization?",
    "Should I include attention training?",
    "Are there distraction elimination?",
    "Do you need meditation practices?",
    "Should I include concentration exercises?",
    "What is your creativity stimulation approach?",
    "Do you need inspiration sources?",

    // Problem Solving
    "Should I include divergent thinking?",
    "Are there brainstorming sessions?",
    "Do you need idea recording?",
    "Should I include creative blocks?",
    "What is your stress management technique?",
    "Do you need relaxation methods?",
    "Should I include breathing exercises?",
    "Are there physical activity needs?",
    "Do you need social support?",
    "Should I include professional help?",

    // Goal Setting
    "What is your goal-setting methodology?",
    "Do you need SMART criteria?",
    "Should I include milestone tracking?",
    "Are there accountability partners?",
    "Do you need progress reviews?",
    "Should I include adjustment strategies?",
    "What is your decision-making framework?",
    "Do you need pros and cons analysis?",
    "Should I include risk assessment?",
    "Are there opportunity costs?",

    // Technology & AI
    "What is your artificial intelligence approach?",
    "Do you need automation opportunities?",
    "Should I include machine learning?",
    "Are there chatbot implementation?",
    "Do you need predictive analytics?",
    "Should I include smart processes?",
    "What is your blockchain consideration?",
    "Do you need distributed ledger?",
    "Should I include smart contracts?",
    "Are there cryptocurrency integration?",

    // IoT & Cloud
    "What is your internet of things?",
    "Do you need sensor deployment?",
    "Should I include data collection?",
    "Are there connectivity solutions?",
    "Do you need device management?",
    "Should I include security measures?",
    "What is your cloud computing?",
    "Do you need infrastructure migration?",
    "Should I include service selection?",
    "Are there security considerations?",

    // Architecture & Design
    "What is your microservices architecture?",
    "Do you need service decomposition?",
    "Should I include API management?",
    "Are there data consistency?",
    "Do you need fault tolerance?",
    "Should I include deployment strategies?",
    "What is your DevOps implementation?",
    "Do you need continuous integration?",
    "Should I include automated testing?",
    "Are there deployment pipelines?",

    // Code & Development
    "Do you need monitoring dashboards?",
    "Should I include rollback procedures?",
    "What is your site reliability engineering?",
    "Do you need service level objectives?",
    "Should I include error budgets?",
    "Are there incident management?",
    "Do you need chaos engineering?",
    "Should I include capacity planning?",
    "What is your observability?",
    "Do you need logging strategies?",

    // Output Formatting
    "What output format works best for your use case?",
    "Do you need the response in markdown, plain text, or code?",
    "Should I use headers and sections to organize the response?",
    "Do you want numbered lists or bullet points?",
    "Should I include a summary at the beginning or end?",
    "Do you need the response to be exportable to a specific format?",
    "Should I include code blocks with syntax highlighting?",
    "Do you want tables for comparing information?",
    "Should I use bold or italics for emphasis?",
    "Do you need separators between sections?",

    // Clarification Questions
    "Is there anything ambiguous about your request I should clarify?",
    "Should I ask follow-up questions if I'm unsure?",
    "Do you want me to state my assumptions explicitly?",
    "Should I flag areas where I need more information?",
    "Do you want multiple options to choose from?",
    "Should I explain my reasoning process?",
    "Do you need me to validate my understanding first?",
    "Should I provide confidence levels for my responses?",
    "Do you want me to acknowledge limitations?",
    "Should I suggest alternative approaches?",

    // Response Quality
    "How should I handle uncertainty in my response?",
    "Do you want me to be comprehensive or focused?",
    "Should I prioritize speed or thoroughness?",
    "Do you need peer-reviewed or expert-level quality?",
    "Should I include disclaimers where appropriate?",
    "Do you want me to cross-reference multiple sources?",
    "Should I provide the latest information available?",
    "Do you need historical perspective as well?",
    "Should I include counterarguments or opposing views?",
    "Do you want balanced or opinionated responses?",
];

// ============================================
// Organized Principles for UI Display
// ============================================

const PRINCIPLES = {
    audience: {
        name: 'Audience & Intent',
        icon: '👥',
        description: 'Define who will use this and what you want to achieve',
        keywords: ['audience', 'reader', 'user', 'for', 'targeted', 'aimed at'],
        questions: [
            {
                id: 'audience-target',
                text: 'What is your intended audience for this prompt?',
                placeholder: 'e.g., Developers, Marketing team, Students, General public',
                hint: 'Knowing the audience helps tailor complexity and terminology'
            },
            {
                id: 'audience-knowledge',
                text: 'What is their familiarity level with this topic?',
                placeholder: 'e.g., Beginner, Intermediate, Expert, Mixed',
                hint: 'This determines how much background to include'
            }
        ]
    },
    task: {
        name: 'Task & Goal',
        icon: '🎯',
        description: 'Be specific about what you want accomplished',
        keywords: ['create', 'write', 'generate', 'explain', 'analyze', 'list', 'summarize', 'build', 'design'],
        questions: [
            {
                id: 'task-action',
                text: 'What specific task or goal do you want the AI to accomplish?',
                placeholder: 'e.g., Write a function, Explain a concept, Create a plan',
                hint: 'Use clear action verbs: write, create, explain, analyze, compare'
            },
            {
                id: 'task-detail',
                text: 'What level of detail do you require in the response?',
                placeholder: 'e.g., Quick overview, Detailed explanation, Step-by-step guide',
                hint: 'Defining scope prevents responses that are too brief or verbose'
            }
        ]
    },
    format: {
        name: 'Format & Structure',
        icon: '📋',
        description: 'Specify how the response should be organized',
        keywords: ['format', 'structure', 'list', 'bullet', 'table', 'json', 'markdown', 'code'],
        questions: [
            {
                id: 'format-type',
                text: 'What format or structure do you prefer for the response?',
                placeholder: 'e.g., Bullet points, Numbered list, Paragraphs, Code block, Table',
                hint: 'Structured formats are easier to parse and use'
            },
            {
                id: 'format-length',
                text: 'What is your preferred length for the response?',
                placeholder: 'e.g., Under 200 words, 1-2 paragraphs, Comprehensive',
                hint: 'Length constraints ensure responses fit your needs'
            }
        ]
    },
    tone: {
        name: 'Tone & Style',
        icon: '🎨',
        description: 'Define the voice and manner of response',
        keywords: ['tone', 'style', 'formal', 'casual', 'friendly', 'professional', 'humorous', 'serious'],
        questions: [
            {
                id: 'tone-formality',
                text: 'Do you need the response to be formal or informal?',
                placeholder: 'e.g., Professional, Casual, Academic, Conversational',
                hint: 'Tone affects how the message is received'
            },
            {
                id: 'tone-voice',
                text: 'What tone should the AI use when responding?',
                placeholder: 'e.g., Encouraging, Authoritative, Friendly, Neutral',
                hint: 'The voice should match your audience and purpose'
            }
        ]
    },
    context: {
        name: 'Context & Background',
        icon: '📖',
        description: 'Provide necessary background information',
        keywords: ['context', 'background', 'situation', 'scenario', 'given that', 'considering', 'because'],
        questions: [
            {
                id: 'context-situation',
                text: 'What is the context or background information relevant to this prompt?',
                placeholder: 'e.g., I\'m building a SaaS product for healthcare',
                hint: 'Context helps the AI understand the bigger picture'
            },
            {
                id: 'context-purpose',
                text: 'What is the primary purpose - learning, decision-making, or something else?',
                placeholder: 'e.g., Making a purchase decision, Learning a new skill',
                hint: 'Understanding purpose helps tailor the response'
            }
        ]
    },
    constraints: {
        name: 'Constraints & Boundaries',
        icon: '🚧',
        description: 'Set limits and things to avoid',
        keywords: ['maximum', 'minimum', 'only', 'avoid', 'don\'t', 'must not', 'limit', 'exclude'],
        questions: [
            {
                id: 'constraints-avoid',
                text: 'Are there any topics or areas you specifically want to avoid?',
                placeholder: 'e.g., No competitor mentions, Avoid jargon, Skip basic concepts',
                hint: 'Explicit exclusions prevent unwanted content'
            },
            {
                id: 'constraints-requirements',
                text: 'Are there any specific constraints or limitations I should be aware of?',
                placeholder: 'e.g., Budget under $1000, Must use Python, No external APIs',
                hint: 'Constraints help narrow down to practical solutions'
            }
        ]
    },
    examples: {
        name: 'Examples & References',
        icon: '💡',
        description: 'Provide examples of desired output',
        keywords: ['example', 'like this', 'similar to', 'such as', 'for instance', 'sample'],
        questions: [
            {
                id: 'examples-include',
                text: 'Should the response include examples or just explanations?',
                placeholder: 'e.g., Yes, provide code examples, Include real-world cases',
                hint: 'Examples dramatically improve output quality'
            },
            {
                id: 'examples-style',
                text: 'Do you have any preferred sources or references I should consider?',
                placeholder: 'e.g., Official documentation style, Academic papers',
                hint: 'Reference styles guide structure and authority'
            }
        ]
    },
    accuracy: {
        name: 'Accuracy & Priority',
        icon: '✓',
        description: 'Define what matters most',
        keywords: ['accurate', 'precise', 'correct', 'creative', 'innovative', 'priority'],
        questions: [
            {
                id: 'accuracy-priority',
                text: 'Should I prioritize accuracy over creativity or vice versa?',
                placeholder: 'e.g., Accuracy is critical, Prefer creative approaches',
                hint: 'This helps balance factual vs innovative responses'
            },
            {
                id: 'accuracy-citations',
                text: 'Do you need citations or references in the response?',
                placeholder: 'e.g., Yes with links, Just mention sources, Not needed',
                hint: 'Citations add credibility and verifiability'
            }
        ]
    },
    technical: {
        name: 'Technical Depth',
        icon: '⚙️',
        description: 'Specify technical requirements',
        keywords: ['technical', 'code', 'implementation', 'api', 'function', 'algorithm', 'system'],
        questions: [
            {
                id: 'technical-level',
                text: 'Should I provide beginner, intermediate, or advanced content?',
                placeholder: 'e.g., Beginner-friendly, Advanced with optimizations',
                hint: 'Technical level determines depth and assumptions'
            },
            {
                id: 'technical-platform',
                text: 'Are there specific tools or platforms you\'re using?',
                placeholder: 'e.g., Python 3.11, React 18, AWS Lambda',
                hint: 'Platform specifics enable targeted solutions'
            }
        ]
    },
    output: {
        name: 'Output Quality',
        icon: '📊',
        description: 'Define quality expectations',
        keywords: ['quality', 'actionable', 'practical', 'comprehensive', 'concise'],
        questions: [
            {
                id: 'output-actionable',
                text: 'Do you need actionable steps or just information?',
                placeholder: 'e.g., Step-by-step instructions, Just the concept',
                hint: 'Actionable outputs are immediately usable'
            },
            {
                id: 'output-comprehensive',
                text: 'Do you prefer concise answers or comprehensive detailed responses?',
                placeholder: 'e.g., Keep it brief, Include all details',
                hint: 'This balances completeness vs readability'
            }
        ]
    }
};

// ============================================
// Prompt Analyzer
// ============================================

class PromptEngine {
    constructor() {
        this.originalPrompt = '';
        this.answers = {};
        this.principles = PRINCIPLES;
        this.questionBank = QUESTION_BANK;
    }

    /**
     * Get a random subset of questions for variety
     */
    getRandomQuestions(count = 5) {
        const shuffled = [...this.questionBank].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Analyze prompt and return missing principles
     */
    analyzePrompt(prompt) {
        this.originalPrompt = prompt.trim();
        const lowercasePrompt = prompt.toLowerCase();
        const presentPrinciples = [];
        const missingPrinciples = [];

        for (const [key, principle] of Object.entries(this.principles)) {
            const hasKeywords = principle.keywords.some(kw =>
                lowercasePrompt.includes(kw.toLowerCase())
            );

            if (hasKeywords) {
                presentPrinciples.push(key);
            } else {
                missingPrinciples.push(key);
            }
        }

        return {
            original: this.originalPrompt,
            present: presentPrinciples,
            missing: missingPrinciples,
            score: Math.round((presentPrinciples.length / Object.keys(this.principles).length) * 100)
        };
    }

    /**
     * Get questions for a specific principle
     */
    getQuestions(principleKey) {
        const principle = this.principles[principleKey];
        if (!principle) return null;

        return {
            ...principle,
            key: principleKey,
            questions: principle.questions
        };
    }

    /**
     * Save an answer
     */
    saveAnswer(questionId, answer) {
        if (answer && answer.trim()) {
            this.answers[questionId] = answer.trim();
        } else {
            delete this.answers[questionId];
        }
    }

    /**
     * Build improved prompt from original + answers
     */
    buildImprovedPrompt() {
        let parts = [];

        // Audience section
        if (this.answers['audience-target'] || this.answers['audience-knowledge']) {
            if (this.answers['audience-target']) {
                parts.push(`Target audience: ${this.answers['audience-target']}`);
            }
            if (this.answers['audience-knowledge']) {
                parts.push(`Knowledge level: ${this.answers['audience-knowledge']}`);
            }
            parts.push('');
        }

        // Context section
        if (this.answers['context-situation']) {
            parts.push(`Context: ${this.answers['context-situation']}`);
        }
        if (this.answers['context-purpose']) {
            parts.push(`Purpose: ${this.answers['context-purpose']}`);
        }
        if (this.answers['context-situation'] || this.answers['context-purpose']) {
            parts.push('');
        }

        // Task/Main prompt
        parts.push('Task:');
        parts.push(this.originalPrompt);

        if (this.answers['task-action']) {
            parts.push(`Specifically: ${this.answers['task-action']}`);
        }
        if (this.answers['task-detail']) {
            parts.push(`Detail level: ${this.answers['task-detail']}`);
        }
        parts.push('');

        // Format requirements
        if (this.answers['format-type'] || this.answers['format-length']) {
            parts.push('Format requirements:');
            if (this.answers['format-type']) {
                parts.push(`- Format: ${this.answers['format-type']}`);
            }
            if (this.answers['format-length']) {
                parts.push(`- Length: ${this.answers['format-length']}`);
            }
            parts.push('');
        }

        // Tone
        if (this.answers['tone-formality'] || this.answers['tone-voice']) {
            if (this.answers['tone-formality']) {
                parts.push(`Style: ${this.answers['tone-formality']}`);
            }
            if (this.answers['tone-voice']) {
                parts.push(`Tone: ${this.answers['tone-voice']}`);
            }
            parts.push('');
        }

        // Constraints
        if (this.answers['constraints-avoid'] || this.answers['constraints-requirements']) {
            parts.push('Constraints:');
            if (this.answers['constraints-avoid']) {
                parts.push(`- Avoid: ${this.answers['constraints-avoid']}`);
            }
            if (this.answers['constraints-requirements']) {
                parts.push(`- Requirements: ${this.answers['constraints-requirements']}`);
            }
            parts.push('');
        }

        // Examples
        if (this.answers['examples-include']) {
            parts.push(`Examples: ${this.answers['examples-include']}`);
        }
        if (this.answers['examples-style']) {
            parts.push(`Reference style: ${this.answers['examples-style']}`);
        }

        // Accuracy
        if (this.answers['accuracy-priority']) {
            parts.push(`Priority: ${this.answers['accuracy-priority']}`);
        }
        if (this.answers['accuracy-citations']) {
            parts.push(`Citations: ${this.answers['accuracy-citations']}`);
        }

        // Technical
        if (this.answers['technical-level'] || this.answers['technical-platform']) {
            if (this.answers['technical-level']) {
                parts.push(`Technical level: ${this.answers['technical-level']}`);
            }
            if (this.answers['technical-platform']) {
                parts.push(`Platform/Tools: ${this.answers['technical-platform']}`);
            }
        }

        // Output quality
        if (this.answers['output-actionable']) {
            parts.push(`Output type: ${this.answers['output-actionable']}`);
        }
        if (this.answers['output-comprehensive']) {
            parts.push(`Comprehensiveness: ${this.answers['output-comprehensive']}`);
        }

        return parts.filter(p => p !== '').join('\n').trim();
    }

    /**
     * Get improvement score
     */
    getImprovementScore() {
        const answeredCount = Object.keys(this.answers).length;
        const totalQuestions = Object.values(this.principles)
            .reduce((sum, p) => sum + p.questions.length, 0);
        return Math.round((answeredCount / totalQuestions) * 100);
    }

    /**
     * Reset engine
     */
    reset() {
        this.originalPrompt = '';
        this.answers = {};
    }

    /**
     * Get total question count
     */
    getTotalQuestionCount() {
        return this.questionBank.length;
    }
}

// Export for use
window.PromptEngine = PromptEngine;
window.PRINCIPLES = PRINCIPLES;
window.QUESTION_BANK = QUESTION_BANK;
