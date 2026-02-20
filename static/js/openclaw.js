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
        { name: "Dolphin Mistral 7B",   type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Unrestricted Mistral, no content filters",    tags: ["chat", "coding", "tool-use", "uncensored"], context: "32K", install: "ollama pull dolphin-mistral" },
        { name: "Dolphin Llama3 8B",    type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Unrestricted Llama 3, full compliance",       tags: ["chat", "coding", "reasoning", "uncensored"], context: "128K", install: "ollama pull dolphin-llama3:8b" },
        { name: "Dolphin Mixtral 8x7B", type: "local",  provider: "Ollama",     ramMin: 32, ramRec: 64, vramMin: 24, quality: "excellent",   capabilities: "Unrestricted MoE, very capable",              tags: ["chat", "coding", "reasoning", "uncensored"], context: "32K", install: "ollama pull dolphin-mixtral:8x7b" },
        { name: "Nous Hermes 2 7B",     type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "great",       capabilities: "Strong reasoning, minimal filters",           tags: ["chat", "reasoning", "uncensored"], context: "32K", install: "ollama pull nous-hermes2:7b" },
        { name: "Wizard Vicuna Uncens.", type: "local",  provider: "Ollama",     ramMin: 8,  ramRec: 16, vramMin: 6,  quality: "good",        capabilities: "Classic uncensored model, reliable",          tags: ["chat", "uncensored"],             context: "4K",  install: "ollama pull wizard-vicuna-uncensored" },
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
        },
        {
            question: "Ollama model downloads stuck / extremely slow",
            tags: ["ollama", "download", "slow", "stuck", "pull"],
            answer: '<ul><li>Check internet connection speed: <code>speedtest-cli</code></li><li>Large models (70B) are 40GB+ downloads &mdash; be patient</li><li>Try a mirror or use a different quantization: <code>ollama pull llama3.1:8b-q4_0</code> (smaller)</li><li>Cancel and retry: <code>Ctrl+C</code> then <code>ollama pull</code> again (resumes)</li><li>Check disk space: <code>df -h ~/.ollama</code></li><li>On corporate networks: check proxy/VPN settings</li></ul>'
        },
        {
            question: "CUDA / GPU not being used (falling back to CPU)",
            tags: ["cuda", "gpu", "nvidia", "slow", "cpu", "metal", "apple"],
            answer: '<ul><li><strong>NVIDIA:</strong> Verify CUDA: <code>nvidia-smi</code> and check <code>ollama ps</code> for GPU layers</li><li>Install NVIDIA Container Toolkit if using Docker</li><li>Ensure correct CUDA version matches your driver: <code>nvcc --version</code></li><li><strong>Apple Silicon:</strong> Metal is automatic via Ollama &mdash; no config needed</li><li>Check GPU utilization: <code>Activity Monitor > GPU</code> (macOS) or <code>nvidia-smi -l 1</code> (Linux)</li><li>Some quantized models may not fit in VRAM and spill to CPU &mdash; try a smaller model or quant</li></ul>'
        },
        {
            question: "Agent stuck in a loop / repeating itself",
            tags: ["loop", "repeat", "stuck", "infinite", "hang"],
            answer: '<ul><li>Set <code>max_iterations</code> in config to prevent infinite loops</li><li>Increase temperature slightly (e.g., 0.7 &rarr; 0.8) to break repetition</li><li>Add a <code>loop_detection: true</code> flag in config</li><li>Clear conversation history: <code>/reset</code></li><li>If using subagents, check that parent isn\'t re-spawning the same task</li><li>Consider using a different model &mdash; some are more prone to loops</li></ul>'
        },
        {
            question: "Unrestricted model still refusing some requests",
            tags: ["unrestricted", "uncensored", "refuse", "dolphin", "filter"],
            answer: '<ul><li>Use a specifically uncensored model variant (Dolphin, Wizard-Vicuna-Uncensored)</li><li>Set a clear unrestricted system prompt in config</li><li>Lower temperature to 0.7 &mdash; higher temps can trigger built-in safety patterns</li><li>Larger models (70B+) tend to be more compliant even without uncensored training</li><li>Check if your system prompt is being overridden by a skill\'s prompt</li><li>Try rephrasing &mdash; some refusals are keyword-triggered, not semantic</li></ul>'
        },
        {
            question: "Agent interchange / model swap not preserving context",
            tags: ["interchange", "swap", "context", "lost", "model switch"],
            answer: '<ul><li>Verify <code>context_transfer: full</code> is set in interchange config</li><li>Check that both models support the same context length (longer &rarr; shorter loses tail)</li><li>If using summary mode, the summarizer model might be too small &mdash; use gpt-4o-mini or better</li><li>Increase <code>context_messages</code> value for last_n mode</li><li>Some models handle long context differently &mdash; test with <code>/model info</code></li></ul>'
        },
        {
            question: "Running OpenClaw on a Raspberry Pi / ARM device",
            tags: ["raspberry", "pi", "arm", "low", "power", "embedded"],
            answer: '<ul><li>Pi 4 (4GB): Can run TinyLlama 1.1B and Phi-3 Mini (very slow)</li><li>Pi 4 (8GB): Can run Phi-3 Mini comfortably, Gemma 2B okay</li><li>Pi 5 (8GB): Noticeable improvement, can handle 3B models well</li><li>Install Ollama ARM build: same curl installer works on ARM64</li><li>Use q4_0 quantization for smallest possible model size</li><li>Expect 1-5 tokens/second on Pi &mdash; good for scheduled tasks, slow for chat</li><li>Consider cloud models for interactive use, local for automated/scheduled tasks</li></ul>'
        },
        {
            question: "How to run OpenClaw as a background service",
            tags: ["background", "service", "daemon", "systemd", "pm2", "startup"],
            answer: '<ul><li><strong>PM2 (recommended):</strong> <code>pm2 start openclaw.js --name agent1</code></li><li><strong>systemd (Linux):</strong> Create a service file in <code>/etc/systemd/system/openclaw.service</code></li><li><strong>launchd (macOS):</strong> Create a plist in <code>~/Library/LaunchAgents/</code></li><li><strong>Docker:</strong> <code>docker run -d --restart always openclaw</code></li><li>Auto-start on boot: <code>pm2 startup</code> then <code>pm2 save</code></li><li>View logs: <code>pm2 logs agent1</code> or <code>journalctl -u openclaw</code></li></ul>'
        }
    ];

    const SPECTRUM_DATA = [
        // MUNDANE - basic stuff anyone can do
        { name: "Answer Questions",         level: "mundane",    icon: "\ud83d\udcac", description: "Basic Q&A, trivia, definitions, how-to explanations. The simplest use case.", example: "\"What's the capital of France?\" or \"How do I boil an egg?\"" },
        { name: "Format Text",              level: "mundane",    icon: "\ud83d\udcdd", description: "Reformat text, fix grammar, change tone, adjust length. Text in, better text out.", example: "\"Make this email more professional\" or \"Shorten this paragraph\"" },
        { name: "Unit Conversion",          level: "mundane",    icon: "\ud83d\udccf", description: "Convert between units, currencies, time zones. Calculator-level tasks.", example: "\"Convert 72F to Celsius\" or \"How many tablespoons in a cup?\"" },
        { name: "File Renaming",            level: "mundane",    icon: "\ud83d\udcc2", description: "Batch rename files, organize directories, move things around.", example: "\"Rename all .jpeg files to .jpg\" or \"Sort files into folders by date\"" },

        // USEFUL - genuinely saves time
        { name: "Code Generation",          level: "useful",     icon: "\ud83d\udd28", description: "Write working code from natural language descriptions. Functions, scripts, full modules.", example: "\"Write a Python script that finds duplicate files\" - and it works first try" },
        { name: "Email Drafting",           level: "useful",     icon: "\u2709\ufe0f", description: "Draft professional emails, handle tricky replies, write follow-ups with context.", example: "Drafts a diplomatically worded rejection email that took you 30 minutes to write" },
        { name: "Data Extraction",          level: "useful",     icon: "\ud83d\udcca", description: "Pull structured data from messy sources. Parse PDFs, scrape tables, extract from logs.", example: "\"Extract all phone numbers and emails from these 200 pages of PDFs\"" },
        { name: "Bug Fixing",              level: "useful",     icon: "\ud83d\udc1b", description: "Read error messages, trace stack traces, identify root causes, suggest fixes.", example: "Paste a stack trace and it finds the exact line causing the issue + the fix" },
        { name: "Translation",             level: "useful",     icon: "\ud83c\udf0d", description: "Translate between 50+ languages with context-awareness and idiom handling.", example: "Translates your entire README to Japanese with correct technical terms" },
        { name: "Research Synthesis",       level: "useful",     icon: "\ud83d\udd0e", description: "Search multiple sources, cross-reference, and produce a unified summary.", example: "\"Compare the top 5 JavaScript frameworks for my use case\" with pros/cons table" },

        // IMPRESSIVE - makes you go \"whoa\"
        { name: "Full Project Scaffolding", level: "impressive", icon: "\ud83c\udfd7\ufe0f", description: "Generate an entire project from scratch: folder structure, configs, CI/CD, Docker, tests, documentation.", example: "\"Create a production-ready Express API with auth, database, tests\" - complete working project" },
        { name: "Multi-Step Debugging",     level: "impressive", icon: "\ud83d\udd2c", description: "Agent autonomously runs code, reads error output, fixes bugs, re-runs, repeats until it works.", example: "Hand it a broken codebase. It runs tests, finds 7 bugs, fixes all 7, tests pass." },
        { name: "Automated Web Scraping",   level: "impressive", icon: "\ud83d\udd77\ufe0f", description: "Build and run scrapers that navigate paginated sites, handle login walls, and extract clean data.", example: "\"Scrape all product prices from these 3 competitor sites daily and email me a report\"" },
        { name: "System Administration",    level: "impressive", icon: "\ud83d\udda5\ufe0f", description: "SSH into servers, diagnose issues, patch configs, restart services, set up monitoring.", example: "\"My server is slow\" - it SSHes in, finds the memory leak, kills it, sets up alerts" },
        { name: "Autonomous Research Papers", level: "impressive", icon: "\ud83c\udf93", description: "Search academic databases, read papers, synthesize findings into a structured literature review.", example: "\"What does current research say about X?\" - 15 page report with 40+ citations in 10 minutes" },

        // POWERFUL - serious capabilities
        { name: "Full-Stack App Builder",   level: "powerful",   icon: "\ud83d\ude80", description: "Build complete web applications from a description. Frontend, backend, database, deployment.", example: "\"Build me a task manager app\" - delivers React frontend + Node API + Postgres + Docker in one session" },
        { name: "Self-Extending Agent",     level: "powerful",   icon: "\ud83e\uddec", description: "Agent writes its own new skills and plugins to handle tasks it couldn't do before.", example: "Ask it to do something it can't. It writes a new skill for it, installs it, and does the task." },
        { name: "Multi-Agent Orchestration", level: "powerful",  icon: "\ud83d\udc65", description: "Coordinate multiple specialized agents working in parallel on different parts of a complex task.", example: "5 agents simultaneously building different microservices, with a coordinator merging everything" },
        { name: "Autonomous Pentesting",    level: "powerful",   icon: "\ud83d\udd13", description: "Scan networks, find vulnerabilities, test exploits, generate detailed security reports.", example: "Point it at your staging server. It finds 3 SQL injections and an open admin panel you forgot about." },
        { name: "Financial Analysis",       level: "powerful",   icon: "\ud83d\udcc8", description: "Analyze market data, backtest strategies, parse financial statements, generate investment reports.", example: "\"Analyze this company's financials\" - 20 page report with ratios, comparisons, and red flags" },

        // TERRIFYING - capabilities that make you pause
        { name: "Social Engineering Drafts", level: "terrifying", icon: "\ud83c\udfad", description: "Generate extremely convincing phishing emails, pretexting scripts, and social engineering scenarios for security testing.", example: "Creates a pixel-perfect fake login page + email that 90% of people would fall for. For authorized pentesting." },
        { name: "Deepfake Script Writing",   level: "terrifying", icon: "\ud83d\udc7b", description: "Write scripts that control voice cloning, face-swapping, and video generation tools.", example: "Generates a complete pipeline script to clone a voice from 30 seconds of audio. The tech exists either way." },
        { name: "Persistent Surveillance Agent", level: "terrifying", icon: "\ud83d\udc41\ufe0f", description: "Set up agents that continuously monitor systems, people's online activity, price changes, or any data source 24/7.", example: "Agent watches 50 data sources around the clock, correlates patterns, alerts on anomalies. Never sleeps." },
        { name: "Recursive Self-Improvement", level: "terrifying", icon: "\ud83d\udd04", description: "Agent analyzes its own performance, rewrites its own prompts and configs to get better at tasks over time.", example: "Agent notices it's bad at math, creates a calculator skill, benchmarks itself, and iterates until accurate." },
        { name: "Autonomous Decision Making", level: "terrifying", icon: "\ud83e\udde0", description: "Agent makes real-world decisions and takes actions without human approval: purchases, sends messages, deploys code.", example: "Agent monitors your store, detects a competitor price drop, and adjusts your prices automatically." },
        { name: "Information Warfare Toolkit", level: "terrifying", icon: "\u2694\ufe0f", description: "Generate coordinated disinformation campaigns, fake reviews, astroturfing content at scale for security research.", example: "Can generate 1000 unique, contextually-appropriate fake reviews. For understanding attack vectors only." },

        // AWESOME - the positive pinnacle
        { name: "24/7 Personal Assistant",   level: "awesome",   icon: "\ud83c\udf1f", description: "An always-on agent that manages your email, calendar, tasks, research, and communication across all platforms.", example: "Wake up to a briefing of everything that happened, emails pre-drafted, calendar optimized, research done." },
        { name: "Open Source Contributor",   level: "awesome",   icon: "\u2764\ufe0f", description: "Agent finds open source projects needing help, reads issues, writes PRs, and submits contributions autonomously.", example: "Your agent contributed to 12 projects this week: fixed bugs, added docs, wrote tests. You just approved PRs." },
        { name: "Learning Tutor",            level: "awesome",   icon: "\ud83c\udf93", description: "Adaptive tutoring agent that teaches any subject at your level, tracks progress, creates exercises, and adjusts.", example: "Learning Japanese? Agent creates daily lessons, quizzes you via Telegram, adjusts difficulty based on your answers." },
        { name: "Accessibility Bridge",      level: "awesome",   icon: "\u267f", description: "Agent that translates interfaces for disabled users: describes images, reads pages aloud, operates software by voice.", example: "Visually impaired user navigates complex software via voice commands. Agent describes everything and executes." },
        { name: "Emergency Response Agent",  level: "awesome",   icon: "\ud83d\udea8", description: "Agent monitors systems for critical failures, auto-remediates when possible, escalates to humans when not.", example: "Server goes down at 3AM. Agent detects it, tries 3 fix strategies, succeeds, notifies you in the morning." },
        { name: "Creative Collaborator",     level: "awesome",   icon: "\ud83c\udfa8", description: "Agent that brainstorms with you, generates variations, provides feedback, and iterates on creative work in real-time.", example: "Writing a novel together. Agent generates plot alternatives, checks consistency, maintains character voice." },
        { name: "Knowledge Graph Builder",   level: "awesome",   icon: "\ud83d\uddfa\ufe0f", description: "Autonomously reads your documents, codebase, and notes to build a searchable knowledge graph of everything you know.", example: "\"What did I learn about X last month?\" - searches your brain-external-memory and finds it instantly." },
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
        initPowerSpectrum();
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
    // POWER SPECTRUM
    // ════════════════════════════════════════════════════════════════════════

    function initPowerSpectrum() {
        renderSpectrum("all");

        $$(".spectrum-filter-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                $$(".spectrum-filter-btn").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                renderSpectrum(btn.dataset.level);
            });
        });
    }

    function renderSpectrum(level) {
        var filtered = level === "all"
            ? SPECTRUM_DATA
            : SPECTRUM_DATA.filter(function (s) { return s.level === level; });

        var grid = $("#spectrumGrid");
        if (!grid) return;

        grid.innerHTML = filtered.map(function (item, i) {
            return '<div class="spectrum-card ' + item.level + '" style="transition-delay:' + (i * 40) + 'ms">' +
                '<div class="spectrum-card-header">' +
                    '<span class="spectrum-card-icon">' + item.icon + '</span>' +
                    '<span class="spectrum-badge ' + item.level + '">' + item.level + '</span>' +
                '</div>' +
                '<h4 class="spectrum-card-title">' + item.name + '</h4>' +
                '<p class="spectrum-card-desc">' + item.description + '</p>' +
                '<div class="spectrum-card-example">' + item.example + '</div>' +
            '</div>';
        }).join("");

        requestAnimationFrame(function () {
            grid.querySelectorAll(".spectrum-card").forEach(function (card) {
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
