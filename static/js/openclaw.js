(function () {
    "use strict";

    // ════════════════════════════════════════════════════════════════════════
    // DATA CONSTANTS
    // ════════════════════════════════════════════════════════════════════════

    const MODEL_RAM_DATA = [
        // Local models via Ollama
        { name: "TinyLlama 1.1B",       type: "local",  provider: "Ollama",     ramMin: 2,  ramRec: 4,  vramMin: 2,  quality: "basic",       capabilities: "Simple Q&A, basic tasks",                     tags: ["chat"],                          context: "2K",   install: "ollama pull tinyllama" },
        { name: "Phi-3 Mini 3.8B",      type: "local",  provider: "Ollama",     ramMin: 4,  ramRec: 8,  vramMin: 3,  quality: "good",        capabilities: "Coding help, reasoning, chat",                tags: ["chat", "coding", "reasoning"],   context: "4K",   install: "ollama pull phi3:mini" },
        { name: "Gemma 2 2B",           type: "local",  provider: "Ollama",     ramMin: 4,  ramRec: 6,  vramMin: 2,  quality: "good",        capabilities: "Lightweight, efficient, multilingual",        tags: ["chat", "multilingual"],          context: "8K",   install: "ollama pull gemma2:2b" },
        { name: "Llama 3.1 8B",         type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "General agent tasks, tool use, coding",       tags: ["chat", "coding", "tool-use", "reasoning"], context: "128K", install: "ollama pull llama3.1:8b" },
        { name: "Mistral 7B",           type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Fast inference, multilingual, function calls", tags: ["chat", "coding", "tool-use", "multilingual"], context: "32K", install: "ollama pull mistral" },
        { name: "Gemma 2 9B",           type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Balanced performance, solid for agents",      tags: ["chat", "coding", "reasoning"],   context: "8K",   install: "ollama pull gemma2:9b" },
        { name: "CodeLlama 7B",         type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Code completion, generation, explanation",    tags: ["coding"],                        context: "16K",  install: "ollama pull codellama" },
        { name: "DeepSeek Coder V2 16B",type: "local",  provider: "Ollama",     ramMin: 16, ramRec: 32, vramMin: 12, quality: "excellent",   capabilities: "Advanced coding, debugging, code generation", tags: ["coding", "tool-use"],            context: "128K", install: "ollama pull deepseek-coder-v2" },
        { name: "Qwen 2.5 14B",         type: "local",  provider: "Ollama",     ramMin: 16, ramRec: 32, vramMin: 10, quality: "excellent",   capabilities: "Advanced reasoning, long context, coding",    tags: ["chat", "coding", "reasoning", "tool-use", "multilingual"], context: "128K", install: "ollama pull qwen2.5:14b" },
        { name: "Llama 3.1 70B",        type: "local",  provider: "Ollama",     ramMin: 64, ramRec: 64, vramMin: 40, quality: "exceptional", capabilities: "Near-cloud quality, complex orchestration",   tags: ["chat", "coding", "reasoning", "tool-use"], context: "128K", install: "ollama pull llama3.1:70b" },
        { name: "Mixtral 8x7B (MoE)",   type: "local",  provider: "Ollama",     ramMin: 32, ramRec: 64, vramMin: 24, quality: "excellent",   capabilities: "MoE architecture, fast for its quality",      tags: ["chat", "coding", "reasoning", "multilingual"], context: "32K", install: "ollama pull mixtral" },
        { name: "Any GGUF Model",       type: "local",  provider: "llama.cpp",  ramMin: 4,  ramRec: 8,  vramMin: 0,  quality: "varies",      capabilities: "CPU inference, quantized models, flexible",   tags: ["chat"],                          context: "Varies", install: "# Use llama.cpp with any .gguf file" },

        // Cloud models
        { name: "GPT-4o",               type: "cloud",  provider: "OpenAI",     ramMin: 0, ramRec: 0, vramMin: 0, quality: "exceptional", capabilities: "Best general reasoning, vision, tool use",     tags: ["chat", "coding", "reasoning", "tool-use", "vision"], context: "128K", install: "OPENAI_API_KEY=sk-..." },
        { name: "GPT-4o Mini",          type: "cloud",  provider: "OpenAI",     ramMin: 0, ramRec: 0, vramMin: 0, quality: "great",       capabilities: "Fast, cheap, good for most agent tasks",       tags: ["chat", "coding", "tool-use"],    context: "128K", install: "OPENAI_API_KEY=sk-..." },
        { name: "Claude Sonnet 4",      type: "cloud",  provider: "Anthropic",  ramMin: 0, ramRec: 0, vramMin: 0, quality: "exceptional", capabilities: "Excellent reasoning, coding, long context",    tags: ["chat", "coding", "reasoning", "tool-use"], context: "200K", install: "ANTHROPIC_API_KEY=sk-ant-..." },
        { name: "Claude Haiku",         type: "cloud",  provider: "Anthropic",  ramMin: 0, ramRec: 0, vramMin: 0, quality: "great",       capabilities: "Fast, cost-effective agent backbone",          tags: ["chat", "coding", "tool-use"],    context: "200K", install: "ANTHROPIC_API_KEY=sk-ant-..." },
        { name: "Gemini 1.5 Pro",       type: "cloud",  provider: "Google",     ramMin: 0, ramRec: 0, vramMin: 0, quality: "exceptional", capabilities: "Massive context window, multimodal",           tags: ["chat", "coding", "reasoning", "vision", "tool-use"], context: "2M", install: "GOOGLE_AI_KEY=AI..." },
        { name: "Gemini 1.5 Flash",     type: "cloud",  provider: "Google",     ramMin: 0, ramRec: 0, vramMin: 0, quality: "great",       capabilities: "Fast, affordable, good reasoning",             tags: ["chat", "coding", "tool-use"],    context: "1M",  install: "GOOGLE_AI_KEY=AI..." },
        { name: "Groq (Llama 3.1 70B)", type: "cloud",  provider: "Groq",       ramMin: 0, ramRec: 0, vramMin: 0, quality: "excellent",   capabilities: "Extremely fast inference, free tier available", tags: ["chat", "coding", "reasoning", "tool-use"], context: "128K", install: "GROQ_API_KEY=gsk_..." },
        { name: "OpenRouter (any)",     type: "cloud",  provider: "OpenRouter",  ramMin: 0, ramRec: 0, vramMin: 0, quality: "varies",      capabilities: "Route to any model via unified API",           tags: ["chat", "coding", "reasoning", "tool-use"], context: "Varies", install: "OPENROUTER_API_KEY=sk-or-..." },
        { name: "Together AI",          type: "cloud",  provider: "Together",    ramMin: 0, ramRec: 0, vramMin: 0, quality: "varies",      capabilities: "Many open models, affordable pricing",         tags: ["chat", "coding"],                context: "Varies", install: "TOGETHER_API_KEY=..." },
    ];

    const SKILLS_DATA = [
        // Automation
        { name: "File Management",       category: "automation",    difficulty: "basic",        icon: "\ud83d\udcc1", description: "Create, read, write, move, and delete files and directories autonomously" },
        { name: "Shell Commands",         category: "automation",    difficulty: "basic",        icon: "\ud83d\udcbb", description: "Execute terminal commands, bash scripts, and system operations" },
        { name: "Scheduled Tasks",        category: "automation",    difficulty: "intermediate", icon: "\u23f0",       description: "Set up cron jobs, timers, and recurring automated tasks via heartbeat" },
        { name: "Web Scraping",           category: "automation",    difficulty: "intermediate", icon: "\ud83c\udf10", description: "Extract data from websites, parse HTML, monitor pages for changes" },
        { name: "API Integration",        category: "automation",    difficulty: "intermediate", icon: "\ud83d\udd17", description: "Call REST APIs, handle authentication, process JSON responses" },
        { name: "Workflow Pipelines",     category: "automation",    difficulty: "advanced",     icon: "\u2699\ufe0f", description: "Chain multiple operations into complex automated multi-step workflows" },
        { name: "Email Automation",       category: "automation",    difficulty: "intermediate", icon: "\ud83d\udce7", description: "Send, read, and process emails automatically. Draft and schedule replies" },
        { name: "Calendar Management",    category: "automation",    difficulty: "intermediate", icon: "\ud83d\udcc5", description: "Create events, set reminders, manage schedules across platforms" },

        // Coding
        { name: "Code Generation",        category: "coding",    difficulty: "basic",        icon: "\ud83d\udd28", description: "Generate code in Python, JavaScript, TypeScript, Rust, Go, and 20+ languages" },
        { name: "Code Review",            category: "coding",    difficulty: "intermediate", icon: "\ud83d\udd0d", description: "Review code for bugs, security issues, performance, and best practices" },
        { name: "Debugging",              category: "coding",    difficulty: "intermediate", icon: "\ud83d\udc1b", description: "Identify and fix bugs with stack trace analysis and root cause detection" },
        { name: "Refactoring",            category: "coding",    difficulty: "intermediate", icon: "\ud83d\udd04", description: "Restructure code for better readability, performance, and maintainability" },
        { name: "Test Writing",           category: "coding",    difficulty: "intermediate", icon: "\u2705",       description: "Generate unit tests, integration tests, and full test suites" },
        { name: "Git Operations",         category: "coding",    difficulty: "basic",        icon: "\ud83d\udcc8", description: "Commit, branch, merge, resolve conflicts, create PRs" },
        { name: "Project Scaffolding",    category: "coding",    difficulty: "advanced",     icon: "\ud83c\udfd7\ufe0f", description: "Generate complete project structures with configs, CI/CD, and docs" },
        { name: "Database Operations",    category: "coding",    difficulty: "intermediate", icon: "\ud83d\uddc3\ufe0f", description: "Write queries, create migrations, manage schemas across SQL and NoSQL" },

        // Research
        { name: "Web Search",             category: "research",  difficulty: "basic",        icon: "\ud83d\udd0e", description: "Search the internet, aggregate results, compare sources, cite references" },
        { name: "Document Analysis",      category: "research",  difficulty: "intermediate", icon: "\ud83d\udcc4", description: "Read, parse, and summarize PDFs, docs, spreadsheets, and long texts" },
        { name: "Data Analysis",          category: "research",  difficulty: "intermediate", icon: "\ud83d\udcca", description: "Analyze datasets, generate charts, find patterns, compute statistics" },
        { name: "Competitive Analysis",   category: "research",  difficulty: "advanced",     icon: "\ud83c\udfc6", description: "Research competitors, compare products, generate market intelligence" },
        { name: "Academic Research",      category: "research",  difficulty: "advanced",     icon: "\ud83c\udf93", description: "Find papers, summarize findings, generate literature reviews" },

        // Communication
        { name: "Email Drafting",         category: "communication", difficulty: "basic",        icon: "\u2709\ufe0f", description: "Write professional emails, newsletters, and automated responses" },
        { name: "Report Generation",      category: "communication", difficulty: "intermediate", icon: "\ud83d\udccb", description: "Create structured reports with data, charts, and actionable insights" },
        { name: "Translation",            category: "communication", difficulty: "basic",        icon: "\ud83c\udf0d", description: "Translate between 50+ languages with context-aware accuracy" },
        { name: "Social Media",           category: "communication", difficulty: "intermediate", icon: "\ud83d\udce2", description: "Draft posts for X/Twitter, LinkedIn, and other platforms" },
        { name: "Chat Summarization",     category: "communication", difficulty: "basic",        icon: "\ud83d\uddd2\ufe0f", description: "Summarize long conversations, threads, and meeting notes" },

        // System
        { name: "System Monitoring",      category: "system",    difficulty: "intermediate", icon: "\ud83d\udcbb", description: "Monitor CPU, RAM, disk, network, GPU. Alert on thresholds" },
        { name: "Log Analysis",           category: "system",    difficulty: "intermediate", icon: "\ud83d\udcdc", description: "Parse and analyze log files, identify errors, spot anomalies" },
        { name: "Docker Management",      category: "system",    difficulty: "intermediate", icon: "\ud83d\udce6", description: "Build, run, and manage containers and docker-compose stacks" },
        { name: "Server Admin",           category: "system",    difficulty: "advanced",     icon: "\ud83d\udda5\ufe0f", description: "Manage servers, deploy applications, configure services and networking" },
        { name: "Smart Home",             category: "system",    difficulty: "intermediate", icon: "\ud83c\udfe0", description: "Control IoT devices via SwitchBot, Tado, and other integrations" },
        { name: "SSH Remote Access",      category: "system",    difficulty: "intermediate", icon: "\ud83d\udd10", description: "Connect to remote servers, execute commands, transfer files over SSH" },

        // Creative
        { name: "Content Writing",        category: "creative",  difficulty: "basic",        icon: "\u270d\ufe0f", description: "Blog posts, articles, marketing copy, stories, and creative writing" },
        { name: "Image Generation",       category: "creative",  difficulty: "intermediate", icon: "\ud83c\udfa8", description: "Generate images via DALL-E, Stable Diffusion, Midjourney integrations" },
        { name: "Music Composition",      category: "creative",  difficulty: "advanced",     icon: "\ud83c\udfb5", description: "Create melodies, chord progressions, lyrics, and full compositions" },
        { name: "Video Scripts",          category: "creative",  difficulty: "intermediate", icon: "\ud83c\udfac", description: "Write video scripts, storyboards, shot lists, and captions" },

        // Advanced Autonomous
        { name: "Multi-Step Planning",    category: "advanced",  difficulty: "advanced", icon: "\ud83d\udee0\ufe0f", description: "Break complex goals into executable plans, handle dependencies" },
        { name: "Self-Correction",        category: "advanced",  difficulty: "advanced", icon: "\ud83d\udd04", description: "Detect errors in own output, iterate, and improve results autonomously" },
        { name: "Persistent Memory",      category: "advanced",  difficulty: "advanced", icon: "\ud83e\udde0", description: "Remember past interactions, learn preferences, build context over time" },
        { name: "Agent Spawning",         category: "advanced",  difficulty: "advanced", icon: "\ud83d\udc65", description: "Create child agents for parallel task execution (subagents)" },
        { name: "Autonomous Research",    category: "advanced",  difficulty: "advanced", icon: "\ud83d\ude80", description: "Independently research, synthesize, and report findings without supervision" },
        { name: "Self-Skill Creation",    category: "advanced",  difficulty: "advanced", icon: "\ud83e\uddec", description: "Write code to create new skills and extend own capabilities on the fly" },
        { name: "Canvas Rendering",       category: "advanced",  difficulty: "advanced", icon: "\ud83d\uddbc\ufe0f", description: "Render live interactive UI canvases that users can view and control" },
        { name: "Voice Interaction",      category: "advanced",  difficulty: "intermediate", icon: "\ud83c\udf99\ufe0f", description: "Listen and respond via voice on macOS, iOS, and Android devices" },
    ];

    const TROUBLESHOOT_DATA = [
        {
            question: "Ollama is not responding / connection refused",
            tags: ["ollama", "connection", "local", "server"],
            answer: '<ol><li>Ensure Ollama is running: <code>ollama serve</code></li><li>Check it\'s listening: <code>curl http://localhost:11434/api/tags</code></li><li>Verify a model is pulled: <code>ollama list</code></li><li>Check firewall settings (especially on Windows)</li><li>Try restarting: <code>pkill ollama && ollama serve</code></li><li>On macOS: check System Preferences > Security if blocked</li></ol>'
        },
        {
            question: "Out of memory (OOM) when loading a model",
            tags: ["memory", "ram", "oom", "crash", "killed"],
            answer: '<ul><li>Switch to a smaller model (e.g., 8B instead of 14B)</li><li>Use a quantized version: <code>ollama pull llama3.1:8b-q4_0</code></li><li>Close other applications to free RAM</li><li>Check the Hardware Calculator above for compatible models</li><li>Consider using a cloud model provider instead (no local RAM needed)</li><li>On Linux, check <code>dmesg | grep -i oom</code> for kill logs</li></ul>'
        },
        {
            question: "Telegram bot not receiving messages",
            tags: ["telegram", "bot", "messages", "silent", "no response"],
            answer: '<ol><li>Verify your bot token is correct in <code>.env</code></li><li>Send <code>/start</code> to your bot (required first time)</li><li>Check that your user ID is in <code>TELEGRAM_ALLOWED_USERS</code></li><li>For groups: bot must be admin with message access</li><li>Check webhook conflicts: another service may have set a webhook</li><li>Delete stale webhook: <code>curl https://api.telegram.org/bot&lt;TOKEN&gt;/deleteWebhook</code></li><li>Restart OpenClaw and watch console for Telegram errors</li></ol>'
        },
        {
            question: "API key errors (OpenAI, Anthropic, Google, etc.)",
            tags: ["api", "key", "auth", "openai", "anthropic", "google", "401", "403"],
            answer: '<ul><li>Ensure the key is set correctly in <code>.env</code> (no quotes needed for most)</li><li>Check the key hasn\'t expired or been revoked on the provider dashboard</li><li>Verify billing is set up (many providers require a payment method)</li><li>Check rate limits &mdash; you may have exceeded your quota</li><li>Ensure the env variable name matches exactly: <code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, etc.</li><li>Restart OpenClaw after changing <code>.env</code> (changes aren\'t hot-reloaded)</li></ul>'
        },
        {
            question: "Agent is slow / high latency responses",
            tags: ["slow", "performance", "latency", "speed", "lag"],
            answer: '<ul><li><strong>Local models:</strong> Use a smaller or quantized model, enable GPU offloading</li><li><strong>Cloud models:</strong> Check provider status pages for outages or degradation</li><li>Reduce context window size / conversation history length</li><li>Disable unnecessary skills to reduce prompt size</li><li>Enable streaming mode for faster perceived response times</li><li>On Apple Silicon: Ollama uses Metal by default &mdash; ensure it\'s not falling back to CPU</li><li>On NVIDIA: Verify CUDA is detected: <code>nvidia-smi</code> and <code>ollama ps</code></li></ul>'
        },
        {
            question: "Node.js / pnpm installation errors",
            tags: ["node", "nodejs", "pnpm", "npm", "install", "dependency"],
            answer: '<ul><li>Ensure Node.js 22.12.0+ is installed: <code>node --version</code></li><li>Clear npm cache: <code>npm cache clean --force</code></li><li>Delete <code>node_modules</code> and reinstall: <code>rm -rf node_modules && pnpm install</code></li><li>On Windows, run terminal as Administrator if permission errors occur</li><li>Check for conflicting Node.js versions with <code>nvm ls</code></li><li>Ensure pnpm is installed: <code>npm install -g pnpm</code></li></ul>'
        },
        {
            question: "Agent gives hallucinated / incorrect responses",
            tags: ["hallucination", "accuracy", "quality", "wrong", "incorrect"],
            answer: '<ul><li>Use a more capable model (larger parameters or cloud model)</li><li>Improve your system prompt with specific constraints and instructions</li><li>Enable RAG (retrieval augmented generation) with relevant documents</li><li>Lower temperature for more deterministic outputs: <code>temperature: 0.3</code></li><li>Add fact-checking or web search skills to verify outputs</li><li>For coding: use a specialized coding model like DeepSeek Coder</li></ul>'
        },
        {
            question: "Subagents failing or timing out",
            tags: ["subagent", "timeout", "parallel", "spawn", "fail"],
            answer: '<ul><li>Increase the subagent timeout in config (default: 300s)</li><li>Reduce <code>max_concurrent</code> if system resources are constrained</li><li>Check that the subagent\'s assigned model is available and running</li><li>Break subtasks into smaller, more focused pieces</li><li>Enable subagent logging to see where they get stuck</li><li>Check <code>~/.openclaw/subagents/</code> for transcript logs</li></ul>'
        },
        {
            question: "MoltBook connection issues",
            tags: ["moltbook", "connection", "api", "social"],
            answer: '<ul><li>Verify your MoltBook API key is valid and not expired</li><li>Check that <code>api.moltbook.ai</code> is reachable from your network</li><li>Ensure the moltbook skill is installed: <code>openclaw skill list</code></li><li>Check rate limits (default: 60 requests/minute)</li><li>Review MoltBook status page for service disruptions</li><li>Try <code>openclaw skill reinstall moltbook</code> to update</li></ul>'
        },
        {
            question: "Permission denied errors on Linux / macOS",
            tags: ["permission", "linux", "macos", "denied", "access"],
            answer: '<ul><li>Do NOT run with <code>sudo</code> &mdash; use proper user permissions</li><li>Check file permissions: <code>ls -la</code></li><li>For Ollama: ensure your user is in the correct group</li><li>For shell commands: the agent needs execute permission on target scripts</li><li>Check SELinux/AppArmor on Linux if commands are blocked</li></ul>'
        },
        {
            question: "How to reset the agent / clear conversation history",
            tags: ["reset", "clear", "history", "memory", "fresh"],
            answer: '<ul><li>In Telegram: send <code>/reset</code></li><li>Delete the history file: <code>rm ~/.openclaw/conversations/*</code></li><li>Set <code>max_history_length</code> in config to limit stored context</li><li>Restart the agent process to clear in-memory state</li><li>To reset memory (learned preferences): delete <code>~/.openclaw/memory/</code></li></ul>'
        },
        {
            question: "Multiple agents conflicting on the same machine",
            tags: ["multi", "agent", "conflict", "port", "collision"],
            answer: '<ul><li>Each agent instance needs a unique port if using WebChat</li><li>Set different <code>AGENT_NAME</code> values in each agent\'s <code>.env</code></li><li>Use separate working directories for each agent</li><li>Ollama can serve multiple models but check RAM limits</li><li>Use a process manager like PM2: <code>pm2 start openclaw.js --name agent1</code></li></ul>'
        },
        {
            question: "Skills not loading or not found",
            tags: ["skill", "plugin", "load", "missing", "not found"],
            answer: '<ul><li>Check installed skills: <code>openclaw skill list</code></li><li>Verify skill directory: <code>ls ~/.openclaw/skills/</code></li><li>Each skill needs a <code>SKILL.md</code> file with valid YAML frontmatter</li><li>Reinstall: <code>openclaw skill install &lt;name&gt; --force</code></li><li>Check for version conflicts between skills</li><li>Workspace skills go in <code>&lt;project&gt;/skills/</code></li></ul>'
        }
    ];

    // ════════════════════════════════════════════════════════════════════════
    // DOM HELPERS
    // ════════════════════════════════════════════════════════════════════════

    var $ = function (sel) { return document.querySelector(sel); };
    var $$ = function (sel) { return document.querySelectorAll(sel); };

    // ════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ════════════════════════════════════════════════════════════════════════

    document.addEventListener("DOMContentLoaded", function () {
        detectPlatform();
        initNavigation();
        initScrollSpy();
        initOSTabs();
        initRAMCalculator();
        initModelMatrix();
        initSkillsGrid();
        initAccordions();
        initTroubleshooting();
        initScrollAnimations();
        initBackToTop();
        initHeroParticles();
        initCodeCopy();
    });

    // ════════════════════════════════════════════════════════════════════════
    // PLATFORM DETECTION
    // ════════════════════════════════════════════════════════════════════════

    function detectPlatform() {
        var ua = navigator.userAgent.toLowerCase();
        var platform = (navigator.platform || "").toLowerCase();
        var os = "linux";
        if (platform.indexOf("win") !== -1 || ua.indexOf("windows") !== -1) os = "windows";
        else if (platform.indexOf("mac") !== -1 || ua.indexOf("macintosh") !== -1) os = "macos";

        var tabs = $$(".os-tab");
        tabs.forEach(function (tab) {
            tab.classList.toggle("active", tab.dataset.os === os);
        });
        showOSContent(os);
    }

    // ════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ════════════════════════════════════════════════════════════════════════

    function initNavigation() {
        $$(".nav-link").forEach(function (link) {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                var target = document.getElementById(link.dataset.section);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                // Close mobile sidebar
                $("#sidebarNav").classList.remove("open");
                $("#navBackdrop").classList.remove("visible");
            });
        });

        var toggle = $("#navToggle");
        if (toggle) {
            toggle.addEventListener("click", function () {
                $("#sidebarNav").classList.toggle("open");
                $("#navBackdrop").classList.toggle("visible");
            });
        }

        var backdrop = $("#navBackdrop");
        if (backdrop) {
            backdrop.addEventListener("click", function () {
                $("#sidebarNav").classList.remove("open");
                backdrop.classList.remove("visible");
            });
        }
    }

    function initScrollSpy() {
        var sections = $$(".guide-section");
        var navLinks = $$(".nav-link");

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.id;
                    navLinks.forEach(function (link) {
                        link.classList.toggle("active", link.dataset.section === id);
                    });
                }
            });
        }, { rootMargin: "-20% 0px -75% 0px" });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // OS TABS
    // ════════════════════════════════════════════════════════════════════════

    function initOSTabs() {
        $$(".os-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                $$(".os-tab").forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                showOSContent(tab.dataset.os);
            });
        });
    }

    function showOSContent(os) {
        $$(".os-content").forEach(function (el) {
            el.classList.toggle("active", el.dataset.os === os);
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // RAM CALCULATOR
    // ════════════════════════════════════════════════════════════════════════

    function initRAMCalculator() {
        $$(".ram-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                $$(".ram-btn").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                updateRAMResults();
            });
        });

        var gpuCheckbox = $("#hasGpu");
        if (gpuCheckbox) {
            gpuCheckbox.addEventListener("change", function () {
                var vramSel = $("#gpuVramSelector");
                if (vramSel) vramSel.style.display = gpuCheckbox.checked ? "block" : "none";
                updateRAMResults();
            });
        }

        var gpuVram = $("#gpuVram");
        if (gpuVram) {
            gpuVram.addEventListener("change", updateRAMResults);
        }

        updateRAMResults();
    }

    function updateRAMResults() {
        var activeBtn = $(".ram-btn.active");
        var selectedRAM = activeBtn ? parseInt(activeBtn.dataset.ram) : 8;
        var hasGpu = $("#hasGpu") && $("#hasGpu").checked;
        var gpuVram = hasGpu && $("#gpuVram") ? parseInt($("#gpuVram").value) : 0;

        var smooth = [], possible = [], tooLarge = [], cloud = [];

        MODEL_RAM_DATA.forEach(function (model) {
            if (model.type === "cloud") {
                cloud.push(model);
            } else if (selectedRAM >= model.ramRec || (hasGpu && gpuVram >= model.vramMin && model.vramMin > 0)) {
                smooth.push(model);
            } else if (selectedRAM >= model.ramMin) {
                possible.push(model);
            } else {
                tooLarge.push(model);
            }
        });

        var resultsEl = $("#ramResults");
        if (!resultsEl) return;

        resultsEl.innerHTML =
            renderRAMCategory("Runs Smoothly", smooth, "smooth") +
            renderRAMCategory("Can Run (may be slow)", possible, "possible") +
            renderRAMCategory("Needs More RAM", tooLarge, "too-large") +
            renderRAMCategory("Cloud Models (always available)", cloud, "cloud");
    }

    function renderRAMCategory(title, models, className) {
        if (models.length === 0) return "";
        var cards = models.map(function (m) {
            return '<div class="ram-model-card ' + className + '">' +
                '<div class="ram-model-header">' +
                    '<strong>' + m.name + '</strong>' +
                    '<span class="provider-tag">' + m.provider + '</span>' +
                '</div>' +
                '<p class="ram-model-caps">' + m.capabilities + '</p>' +
                '<div class="ram-model-meta">' +
                    (m.type === "local" ? '<span>Min: ' + m.ramMin + 'GB RAM</span>' : '<span>No local RAM needed</span>') +
                    '<span class="quality-tag quality-' + m.quality + '">' + m.quality + '</span>' +
                '</div>' +
            '</div>';
        }).join("");

        return '<div class="ram-category ' + className + '">' +
            '<h4>' + title + ' (' + models.length + ')</h4>' +
            '<div class="ram-model-list">' + cards + '</div>' +
        '</div>';
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODEL MATRIX
    // ════════════════════════════════════════════════════════════════════════

    function initModelMatrix() {
        renderModels("all");

        $$(".filter-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                $$(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                renderModels(btn.dataset.filter);
            });
        });
    }

    function renderModels(filter) {
        var filtered;
        if (filter === "all") {
            filtered = MODEL_RAM_DATA;
        } else if (filter === "local") {
            filtered = MODEL_RAM_DATA.filter(function (m) { return m.type === "local"; });
        } else if (filter === "cloud") {
            filtered = MODEL_RAM_DATA.filter(function (m) { return m.type === "cloud"; });
        } else {
            filtered = MODEL_RAM_DATA.filter(function (m) {
                return m.tags && m.tags.indexOf(filter) !== -1;
            });
        }

        var grid = $("#modelGrid");
        if (!grid) return;

        grid.innerHTML = filtered.map(function (m) {
            var providerClass = m.provider.toLowerCase().replace(/[\s.]/g, "-");
            var capTags = (m.tags || []).map(function (t) {
                return '<span class="capability-tag">' + t + '</span>';
            }).join("");

            return '<div class="model-card">' +
                '<div class="model-card-header">' +
                    '<span class="model-provider-badge ' + providerClass + '">' + m.provider + '</span>' +
                    '<span class="model-quality-badge quality-' + m.quality + '">' + m.quality + '</span>' +
                '</div>' +
                '<h4 class="model-name">' + m.name + '</h4>' +
                '<div class="model-capabilities">' + capTags + '</div>' +
                '<div class="model-specs">' +
                    (m.type === "local" ? '<span>Min RAM: ' + m.ramMin + 'GB</span>' : '<span>Cloud-hosted</span>') +
                    '<span>Context: ' + m.context + '</span>' +
                '</div>' +
                '<div class="model-install"><div class="code-block"><code>' + escapeHtml(m.install) + '</code></div></div>' +
            '</div>';
        }).join("");
    }

    // ════════════════════════════════════════════════════════════════════════
    // SKILLS GRID
    // ════════════════════════════════════════════════════════════════════════

    function initSkillsGrid() {
        renderSkills("all");

        $$(".skill-filter-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                $$(".skill-filter-btn").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                renderSkills(btn.dataset.category);
            });
        });
    }

    function renderSkills(category) {
        var filtered = category === "all"
            ? SKILLS_DATA
            : SKILLS_DATA.filter(function (s) { return s.category === category; });

        var grid = $("#skillsGrid");
        if (!grid) return;

        grid.innerHTML = filtered.map(function (skill, i) {
            return '<div class="skill-card" style="transition-delay:' + (i * 40) + 'ms" ' +
                'data-category="' + skill.category + '" data-difficulty="' + skill.difficulty + '">' +
                '<div class="skill-icon">' + skill.icon + '</div>' +
                '<h4 class="skill-name">' + skill.name + '</h4>' +
                '<p class="skill-desc">' + skill.description + '</p>' +
                '<div class="skill-footer">' +
                    '<span class="difficulty-badge ' + skill.difficulty + '">' + skill.difficulty + '</span>' +
                    '<span class="category-badge">' + skill.category + '</span>' +
                '</div>' +
            '</div>';
        }).join("");

        // Trigger staggered animation
        requestAnimationFrame(function () {
            grid.querySelectorAll(".skill-card").forEach(function (card) {
                card.classList.add("animate-in");
            });
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACCORDIONS
    // ════════════════════════════════════════════════════════════════════════

    function initAccordions() {
        $$(".accordion-header").forEach(function (header) {
            header.addEventListener("click", function () {
                var item = header.parentElement;
                var accordion = item.parentElement;
                var isOpen = item.classList.contains("open");

                // Close siblings
                accordion.querySelectorAll(".accordion-item").forEach(function (i) {
                    i.classList.remove("open");
                });

                if (!isOpen) {
                    item.classList.add("open");
                }
            });
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // TROUBLESHOOTING
    // ════════════════════════════════════════════════════════════════════════

    function initTroubleshooting() {
        renderTroubleshootItems(TROUBLESHOOT_DATA);

        var searchInput = $("#troubleSearch");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                var query = searchInput.value.toLowerCase().trim();
                if (!query) {
                    renderTroubleshootItems(TROUBLESHOOT_DATA);
                    return;
                }
                var filtered = TROUBLESHOOT_DATA.filter(function (item) {
                    return item.question.toLowerCase().indexOf(query) !== -1 ||
                        item.tags.some(function (t) { return t.indexOf(query) !== -1; });
                });
                renderTroubleshootItems(filtered);
            });
        }
    }

    function renderTroubleshootItems(items) {
        var list = $("#troubleshootList");
        if (!list) return;

        if (items.length === 0) {
            list.innerHTML = '<p style="color:var(--oc-text-muted); padding:20px 0;">No matching issues found. Try different search terms.</p>';
            return;
        }

        list.innerHTML = items.map(function (item) {
            return '<div class="accordion-item troubleshoot-item">' +
                '<button class="accordion-header">' +
                    escapeHtml(item.question) +
                    '<span class="accordion-arrow">&#9660;</span>' +
                '</button>' +
                '<div class="accordion-body">' + item.answer + '</div>' +
            '</div>';
        }).join("");

        // Rebind accordion clicks
        list.querySelectorAll(".accordion-header").forEach(function (header) {
            header.addEventListener("click", function () {
                var item = header.parentElement;
                item.classList.toggle("open");
            });
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // SCROLL ANIMATIONS
    // ════════════════════════════════════════════════════════════════════════

    function initScrollAnimations() {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        $$(".guide-section").forEach(function (section) {
            observer.observe(section);
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // BACK TO TOP
    // ════════════════════════════════════════════════════════════════════════

    function initBackToTop() {
        var btn = $("#backToTop");
        if (!btn) return;

        window.addEventListener("scroll", function () {
            btn.classList.toggle("visible", window.scrollY > 500);
        });

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // HERO PARTICLES
    // ════════════════════════════════════════════════════════════════════════

    function initHeroParticles() {
        var container = $("#heroParticles");
        if (!container) return;

        var colors = [
            "var(--oc-cyan)",
            "var(--oc-orange)",
            "var(--oc-purple)",
            "var(--oc-magenta)",
            "var(--oc-cyan)"
        ];

        for (var i = 0; i < 35; i++) {
            var p = document.createElement("div");
            p.className = "particle";
            p.style.left = (Math.random() * 100) + "%";
            p.style.animationDuration = (6 + Math.random() * 12) + "s";
            p.style.animationDelay = (Math.random() * 8) + "s";
            var size = 2 + Math.random() * 4;
            p.style.width = size + "px";
            p.style.height = size + "px";
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.boxShadow = "0 0 " + (size * 2) + "px " + p.style.background;
            container.appendChild(p);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // CODE COPY BUTTONS
    // ════════════════════════════════════════════════════════════════════════

    function initCodeCopy() {
        $$(".code-block").forEach(function (block) {
            var btn = document.createElement("button");
            btn.className = "copy-btn";
            btn.textContent = "Copy";
            btn.addEventListener("click", function () {
                var code = block.querySelector("code");
                if (!code) return;
                var text = code.textContent;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(function () {
                        btn.textContent = "Copied!";
                        btn.classList.add("copied");
                        setTimeout(function () {
                            btn.textContent = "Copy";
                            btn.classList.remove("copied");
                        }, 2000);
                    });
                }
            });
            block.appendChild(btn);
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ════════════════════════════════════════════════════════════════════════

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

})();
