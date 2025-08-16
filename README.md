# WibiClick Frontend (Vue)

This is the frontend application for WibiClick, a comprehensive business management platform built using Vue 3 and Vite.

## 1. Project Overview

WibiClick is a comprehensive business management platform designed to automate and optimize operations for service-based businesses. It integrates a **Vue 3 frontend** (`wibiclick-frontend-vue`) with a **Node.js/TypeScript backend** (`wibiclick_mysql_backend`) powered by a PostgreSQL database via Prisma.

**Core Goal:** To create a largely self-operational system where AI handles the majority of routine tasks, analysis, and customer engagement, enabling businesses to deliver a proactive, data-driven, 5-star service experience previously unseen in the industry.

**Key Functional Areas & Automation Focus:**

*   **CRM & Customer Intelligence:** Manages Customers, Jobs, Employees, Suppliers, and Notes. AI analyzes customer history, communication preferences, and interactions to provide deep insights and predict needs.
    *   *AI Features:* Sentiment Analysis, Timeline Summaries, Profitability Analysis.
*   **Proactive Engagement & Task Automation:** Leverages AI-generated suggestions and automated tasks for customer follow-ups, maintenance reminders, personalized greetings, and post-service surveys. **AI can automatically create internal tasks for staff based on generated suggestions or critical alerts.**
    *   *AI Features:* Follow-up Suggestions, Predictive Maintenance Alerts, Greeting Generation, Survey Generation, Automated Task Creation.
*   **Service Optimization:** AI assists with job scheduling by matching technicians based on skills, availability, and customer preferences/ratings. Manages appliance portfolios and predicts maintenance needs.
    *   *AI Features:* Technician Matching, Predictive Maintenance.
*   **Financial Management:** Standard tools for Invoices, Estimates, Payments, and Expenses, enhanced with AI-driven profitability analysis per customer.
*   **Core Platform:** Includes user authentication (role-based), dashboard, profile management, settings, and real-time notifications (via Ably).

This README documents both the frontend application structure and the backend system it interacts with, highlighting the integrated AI capabilities designed to achieve significant automation.

## 2. System Architecture

WibiClick employs a client-server architecture:

*   **Frontend (`wibiclick-frontend-vue`):** A Single Page Application (SPA) built with Vue 3 and Vite. It handles user interface rendering, local state management (Pinia), routing (Vue Router), and communication with the backend API via Axios. It's responsible for presenting data and AI-driven insights to the user and triggering backend actions.
*   **Backend (`wibiclick_mysql_backend`):** A Node.js/TypeScript application built with Koa.js. It serves as the API layer, handling business logic, database interactions (via Prisma ORM), user authentication, and orchestrating calls to the external AI service.
*   **Database (PostgreSQL via Supabase):** Stores all application data, including customer information, jobs, financials, user accounts, appliance details, AI suggestions, follow-ups, etc. Prisma manages the schema and migrations.
*   **AI Service (External n8n Webhook):** An external service (currently hosted at `https://n8n.wilbertzgroup.com/webhook/llm-calls`) responsible for executing Large Language Model (LLM) prompts. The backend sends specific prompts and context data (e.g., customer history, appliance details) to this webhook, which processes the request using an LLM and returns the generated output (summaries, suggestions, analysis, etc.) to the backend.
*   **Real-time Service (Ably):** Used for pushing real-time notifications or updates to connected frontend clients (e.g., new WhatsApp messages).

**Interaction Flow (Example: AI Suggestion):**

1.  **Frontend:** User navigates to the Customer View page.
2.  **Frontend:** Triggers `fetchFollowupSuggestions` function.
3.  **Frontend:** Sends a `POST` request via Axios to the backend endpoint `/customers/:id/followup-suggestions`.
4.  **Backend:** Receives the request, authenticates the user, and fetches necessary customer data (history, preferences, etc.) from the PostgreSQL database via Prisma.
5.  **Backend:** Constructs a specific prompt using the fetched data and the predefined template from `llm-prompts.ts`.
6.  **Backend:** Sends the prompt data to the external n8n AI Service webhook via the `LlmService`.
7.  **AI Service (n8n):** Receives the data, executes the LLM prompt, and gets the generated suggestions.
8.  **AI Service (n8n):** Returns the suggestions (expected as JSON) to the backend.
9.  **Backend:** Receives the suggestions, potentially performs validation or formatting, and sends them back to the frontend in the API response.
10. **Frontend:** Receives the suggestions via Axios response and updates the UI using the `followupSuggestions` reactive variable.

**Automation Strategy:**

The system aims for high automation by combining scheduled tasks with event-driven processes:

1.  **Scheduled Backend Tasks:** Using Cloud Scheduler (or similar) to trigger backend endpoints (`/tasks/...`) periodically. These tasks perform proactive analysis and actions like generating suggestions, checking for maintenance needs, sending surveys, and dispatching scheduled messages without user intervention.
2.  **Event-Driven Processes (Potential Enhancement):** Key events within the system (e.g., job completion, payment received, negative review submitted) could directly trigger specific backend logic or AI analysis tasks, rather than waiting for the next scheduled run. This could involve internal event emitters or potentially a lightweight message queue for more immediate and reactive automation.
3.  **AI-Driven Logic:** Embedding LLM calls within both user-triggered API endpoints (e.g., generating a summary on demand) and automated background/event-driven tasks (e.g., generating daily suggestions, analyzing a completed job for follow-up opportunities).
4.  **Automated Communication:** Using the `MessagingService` in the backend to automatically send emails, WhatsApp messages (via external API), or potentially SMS based on scheduled tasks, events, or AI suggestions.

## 3. AI Features & Automation Details

This section details the specific AI-powered features and automated workflows implemented in WibiClick.

### 3.1 Customer Insights Generation

*   **Purpose:** To provide staff with quick, actionable summaries and analyses of customer data.
*   **Features:**
    *   **Timeline Summary:** Generates a concise summary of recent customer interactions (jobs, communication, payments).
        *   *Backend:* `POST /customers/:id/timeline-summary` (`customers.ts`), `LlmService`, `llm-prompts.ts` (prompt: `timelineSummary`). Fetches data from `Jobs`, `Whatsapp`, `Notes`, `Payments`, etc.
        *   *Frontend:* `fetchTimelineSummary` in `View.vue`, displayed in the "AI Insights" section.
    *   **Sentiment Analysis:** Analyzes customer communication (e.g., WhatsApp messages, reviews) to determine overall sentiment and key topics.
        *   *Backend:* `POST /customers/:id/analyze-sentiment` (`customers.ts`), `LlmService`, `llm-prompts.ts` (prompt: `sentimentAnalysis`). Fetches data from `Whatsapp`, `Review`, etc.
        *   *Frontend:* `fetchSentimentAnalysis` in `View.vue`, results stored in `sentimentAnalysis` (UI display TBD).
    *   **Profitability Analysis:** Calculates and analyzes the profitability of a customer based on job revenue and associated costs (parts, technician share, etc.).
        *   *Backend:* `POST /customers/:id/profitability-analysis` (`customers.ts`), `LlmService`, `llm-prompts.ts` (prompt: `profitabilityAnalysis`). Uses data potentially aggregated by `GET /customers/:id/financials`.
        *   *Frontend:* `fetchProfitabilityAnalysis` in `View.vue`, displayed in the "AI Insights" section.
*   **Automation Goal:** Provide staff with immediate context and understanding of customer status and value, reducing manual analysis time.
*   **Improvement Suggestion (99% AI Goal):**
    *   **Real-time Sentiment:** Implement automated sentiment analysis triggered immediately after receiving new customer messages (WhatsApp, Email) or reviews. Update a persistent customer sentiment score and trend indicator. Trigger alerts/tasks for staff intervention if sentiment drops significantly or negative keywords are detected.
    *   **Continuous Profitability:** Automatically recalculate customer profitability after every completed job and significant payment/expense event. Use this score to dynamically adjust suggested follow-up frequency, offers, or even pricing tiers (requires careful ethical consideration).
    *   **Predictive Churn Risk:** Train an AI model (potentially separate from the main LLM) to predict customer churn risk based on sentiment trends, interaction frequency, job history, and profitability. Automatically trigger retention-focused tasks or suggestions for at-risk customers.

### 3.2 Proactive Engagement Automation

*   **Purpose:** To automate routine customer communication and follow-ups, ensuring consistent engagement and identifying opportunities.
*   **Features:**
    *   **Follow-up Suggestions:** AI suggests relevant follow-up actions based on completed jobs, customer history, or lack of recent contact.
        *   *Backend:* `POST /customers/:id/followup-suggestions` (`customers.ts`), `LlmService`, `llm-prompts.ts` (prompt: `followupSuggestion`). Also potentially run via scheduled task `/tasks/generate-followup-suggestions` (`tasks.ts`). Suggestions stored in `Suggestion` model.
        *   *Frontend:* `fetchFollowupSuggestions` in `View.vue`. Actions (`scheduleSuggestion`, `sendSuggestionNow`, `logSuggestionManually`, `dismissSuggestion`) interact with `/follow-ups` and `/messaging/send-direct`, `/suggestions/:id/dismiss` backend endpoints.
    *   **Post-Service Surveys:** Automatically triggers survey requests after job completion.
        *   *Backend:* Scheduled task `/tasks/trigger-post-service-surveys` (`tasks.ts`). Uses `Jobs` data, calls `LlmService` (`llm-prompts.ts` prompt: `postServiceSurvey`) to generate message, creates `ServiceFollowUp` record, calls `MessagingService` to send.
        *   *Frontend:* No direct interaction, but survey responses might be viewable later.
    *   **Scheduled Message Sending:** Sends messages (greetings, scheduled follow-ups) at the designated time.
        *   *Backend:* Scheduled task `/tasks/send-scheduled-messages` (`tasks.ts`). Fetches `ServiceFollowUp` records with `status: 'SCHEDULED'`, calls `MessagingService` to send, updates status.
        *   *Frontend:* `fetchScheduledMessages` and `cancelScheduledMessage` in `View.vue` interact with `/follow-ups` endpoint.
    *   **Greeting Generation & Scheduling:** AI generates personalized greetings for holidays, birthdays, or anniversaries.
        *   *Backend:* `POST /customers/:id/generate-greeting` (`customers.ts`), `LlmService`, `llm-prompts.ts` (prompt: `generateGreeting`).
        *   *Frontend:* `fetchHolidayGreetings` calls the generation endpoint. `scheduleGreeting` and `sendGreetingNow` interact with `/follow-ups` and `/messaging/send-direct`. Cancellation uses `cancelScheduledMessage`. Occasion detection logic is currently frontend placeholder.
    *   **Automated Task Creation:** AI identifies situations requiring staff attention (e.g., critical alert, complex suggestion) and automatically creates internal tasks.
        *   *Backend:* (Potential Implementation) Could be integrated into tasks like `/tasks/generate-followup-suggestions` or `/tasks/generate-predictive-maintenance`. Would interact with a `Task` model/controller.
        *   *Frontend:* `createFollowupForAlert` in `View.vue` is a placeholder for triggering this (likely via a modal).
*   **Automation Goal:** Ensure timely and relevant customer communication, reduce missed follow-ups, and automatically flag items needing staff attention.
*   **Improvement Suggestion (99% AI Goal):**
    *   **Automated Response Handling:** Allow AI to handle simple survey responses (e.g., extracting ratings, acknowledging feedback). For more complex responses or negative feedback, automatically create a task for staff review.
    *   **Autonomous Scheduling/Sending:** Empower AI to not just *suggest* but *autonomously schedule and send* routine communications (low-priority follow-ups, standard maintenance reminders, greetings) based on predefined rules, customer preferences, and AI-determined optimal timing, without requiring staff approval for each instance. High-priority or sensitive suggestions would still require review.
    *   **Backend Occasion Detection:** Move the logic for detecting birthdays, anniversaries, and relevant holidays entirely to a backend scheduled task. This task would proactively generate and schedule `GREETING` type `ServiceFollowUp` records.
    *   **Closed-Loop Task Management:** Ensure automated task creation (from alerts/suggestions) includes clear objectives, deadlines, and potentially assigns tasks to specific staff members based on roles or workload (requires employee availability/skill data). AI could monitor task completion status.

### 3.3 Service & Maintenance Automation

*   **Purpose:** To optimize service delivery and proactively manage appliance maintenance.
*   **Features:**
    *   **Predictive Maintenance:** AI analyzes appliance data and service history to predict potential failures and suggest maintenance.
        *   *Backend:* `POST /appliances/:id/predict-maintenance` (`appliances.ts`), `LlmService`, `llm-prompts.ts` (prompt: `predictiveMaintenanceAlert`). Also run via scheduled task `/tasks/generate-predictive-maintenance` (`tasks.ts`). Results stored in `Appliance` model fields (`predMaint...`). Alert dismissal via `POST /appliances/:id/dismiss-alert`.
        *   *Frontend:* `fetchPredictiveMaintenance` in `View.vue`. Alerts displayed in `ApplianceCard.vue`. `handleDismissAlert` calls dismissal endpoint.
    *   **Technician Matching:** AI recommends the best technician for a job based on skills, location, customer history/preference/ratings, and **technician availability during the requested job slot**.
        *   *Backend:* `POST /jobs/match-technician` (`jobs.ts`), `LlmService`, `llm-prompts.ts` (prompt: `technicianMatching`). Uses `Employee`, `Jobs`, `CustomerTechnicianRating`, `Customers` data. Filters technicians based on overlapping jobs during the requested `slotStart` and `slotTime`. **Note:** Currently relies on basic availability checks (active, not on leave) and overlap detection; skills/specialties are placeholders (`[TODO]`).
        *   *Frontend:* `suggestTechnician` in `JobFormModal.vue` calls endpoint (sending `slotStart` and `slotTime`) and displays recommendations.
*   **Automation Goal:** Reduce appliance downtime, optimize technician scheduling, and improve first-time fix rates by suggesting the most suitable *and available* technician.
*   **Improvement Suggestion (99% AI Goal):**
    *   **Automated Service Initiation:** Based on predictive maintenance alert severity and customer communication preferences, allow AI to automatically initiate the service process:
        *   Send a notification to the customer proposing maintenance and suggesting appointment slots (integrating with technician matching/calendars).
        *   Potentially allow customers to confirm/reschedule via automated chat (WhatsApp/Email).
        *   Automatically create a draft job record upon customer confirmation.
    *   **Dynamic Technician Dispatch:** Integrate technician matching directly with real-time location data (if available/ethical) and calendar availability to optimize dispatch and minimize travel time, potentially adjusting schedules automatically for urgent jobs.
    *   **Automated Parts Ordering:** If predictive maintenance identifies likely required parts, AI could automatically check supplier inventory/pricing (via potential API integrations or web scraping) and create draft purchase orders for staff approval.

## 4. Backend Details (`wibiclick_mysql_backend`)

The backend is a Node.js application written in TypeScript, using the Koa.js framework.

### 4.1 Tech Stack (Backend Specific)

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework:** Koa.js
*   **API Routing:** `@koa/router`
*   **Database ORM:** Prisma (Client, Migrate)
*   **Database:** PostgreSQL (hosted on Supabase)
*   **Authentication:** JWT (likely, via custom middleware or library - needs verification) + OIDC for Cloud Scheduler tasks.
*   **HTTP Client:** Axios (for calling external AI service)
*   **Utilities:** `moment`, `qs`, `uuid`

### 4.2 Project Structure (Backend)

(Note: Based on observed file paths during previous sessions. May need verification.)

```
.
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Database migration files
├── src/
│   ├── config/
│   │   └── llm-prompts.ts    # LLM prompt templates
│   ├── controllers/          # API route handlers (Koa middleware)
│   │   ├── index.ts          # Registers all controllers
│   │   ├── customers.ts
│   │   ├── jobs.ts
│   │   ├── appliances.ts
│   │   ├── financials.ts
│   │   ├── follow-ups.ts
│   │   ├── messaging.ts
│   │   ├── suggestions.ts
│   │   ├── tasks.ts          # Scheduled task endpoints
│   │   └── ... (other controllers)
│   ├── helpers/              # Utility functions
│   ├── models/               # Data access logic (using Prisma Client)
│   │   ├── customer.ts
│   │   ├── job.ts
│   │   ├── appliance.ts
│   │   ├── suggestion.ts
│   │   ├── service-follow-up.ts
│   │   └── ... (other models)
│   ├── services/             # Business logic services & external integrations
│   │   ├── auth.ts           # Authentication middleware/helpers
│   │   ├── database.ts       # Prisma client instance (likely)
│   │   ├── error-reporter.ts # Error handling/reporting
│   │   ├── koa-router.ts     # Koa router instance
│   │   ├── llm-service.ts    # Service for interacting with AI webhook
│   │   └── messaging.ts      # Service for sending Email/WhatsApp/SMS
│   ├── server.ts             # Main application entry point (Koa app setup)
│   └── ... (other potential directories like middleware, types)
├── .env                      # Environment variables (Database URL, API keys, etc. - NOT COMMITTED)
├── tsconfig.json             # TypeScript compiler options
├── package.json              # Project dependencies and scripts
└── ... (config files like .eslintrc, .gitignore)
```

### 4.3 Database Schema Overview (Key Models)

(Refer to `prisma/schema.prisma` for full details)

*   **`User`:** Stores user accounts, roles, and relations.
*   **`Organisation`:** Represents the business entity.
*   **`Websites`:** Likely used for multi-tenancy or different site configurations.
*   **`Settings`:** Stores configuration for a website/organisation.
*   **`Customers`:** Core customer data, including contact info, preferences, relations to jobs, appliances, suggestions, follow-ups, etc.
*   **`Employee`:** Staff information, roles, relations to jobs, ratings, etc.
*   **`Jobs`:** Service job details, status, assigned technician, customer link, financial data.
*   **`Appliance`:** Customer appliance details, service history link, predictive maintenance fields.
*   **`Suggestion`:** Stores AI-generated suggestions (type, status, priority, message).
*   **`ServiceFollowUp`:** Tracks follow-up actions (surveys, scheduled messages, manual logs), status, type, content, scheduled date.
*   **`Review`:** Customer reviews linked to jobs, customers, and employees.
*   **`CustomerTechnicianRating`:** Specific ratings given by customers to technicians for particular jobs.
*   **`Whatsapp`:** Logs of WhatsApp messages (used for sentiment analysis, timeline, etc.).
*   **`Payments`, `Invoices`, `Estimates`, `Expenses`, `LineItems`:** Financial records.
*   **`Activities`:** Centralized log/audit trail (potentially linking various actions).
*   **Notes on Schema:**
    *   **Indices:** While newer models include `@@index` definitions, several core models (`Customers`, `Jobs`, `Invoices`, `Estimates`, `Payments`, `Whatsapp`, `Activities`) lack explicit indices on frequently queried fields (like `websiteId`, `customerId`, `employeeId`, status fields, date ranges). Adding these could significantly improve query performance.
    *   **ID Types:** There's a mix of UUIDs (`String`) and auto-incrementing `Int` IDs across different models. While functional, standardizing might improve consistency.
    *   **Missing Fields:** Consider adding `Employee.specialties`, `Job.completedAt`, and `Customer.birthday` to support enhanced AI matching, survey triggering, and greeting features.

### 4.4 API Endpoint Conventions

*   **Base URL:** (Assumed, needs verification - e.g., `/api/v1`)
*   **Authentication:** Most endpoints require authentication (JWT Bearer token in `Authorization` header), checked by `auth.required` middleware. Scheduled task endpoints use OIDC via `schedulerAuthMiddleware`.
*   **Resource Naming:** Generally follows RESTful principles (e.g., `GET /customers`, `GET /jobs`). However, some endpoints combine create/update logic using `POST` (e.g., `POST /add-customer`, `POST /add-job`) based on the presence of an ID in the request body, which deviates from standard REST practices (where `POST` is typically for creation and `PUT`/`PATCH` for updates).
*   **AI Actions:** Often implemented as `POST` requests on specific resources (e.g., `POST /customers/:id/timeline-summary`), which is a common pattern.
*   **Context:** Many endpoints require a `websiteId` passed as a query parameter (consistently named `?id=...`) for authorization or data scoping, enforced by middleware or within controllers.

## 5. Frontend Details (`wibiclick-frontend-vue`)

This section details the Vue 3 frontend application.

### 5.1 Tech Stack (Frontend Specific)

*   **Framework:** Vue 3 (utilizing the Composition API)
*   **Build Tool:** Vite (configured in `vite.config.js`)
*   **Routing:** Vue Router (`src/router/index.js`) - Manages application navigation and implements authentication/authorization guards.
*   **State Management:** Pinia (`src/stores/UserStore.js`) - Used primarily for managing user session state, with persistence enabled via `pinia-plugin-persistedstate`.
*   **Styling:** Tailwind CSS (configured in `tailwind.config.js` and `postcss.config.js`) - Utility-first CSS framework. Global styles in `src/assets/main.css`. Also includes specific CSS files in `src/assets/css/`.
*   **HTTP Client:** Axios - Used for making requests to the backend API. The base URL is configured in `src/main.js` (currently `https://wibi.wilbertzgroup.com/`).
*   **UI Components & Libraries:**
    *   **Forms:** FormKit (`@formkit/vue`, `@formkit/themes`, `formkit`) - Simplifies form creation and validation.
    *   **UI Primitives:** Headless UI (`@headlessui/vue`) - Unstyled, accessible UI components.
    *   **Icons:** Heroicons (`@heroicons/vue`), FontAwesome (`@fortawesome/vue-fontawesome`, `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-brands-svg-icons`, `@fortawesome/free-regular-svg-icons`, `@fortawesome/free-solid-svg-icons`), Boxicons (`boxicons`).
    *   **Data Visualization:** ApexCharts (`vue3-apexcharts`, `apexcharts`), Chart.js (`chart.js`, `chartjs-adapter-moment`, `chartjs-plugin-annotation`).
    *   **Data Grids:** AG Grid (`ag-grid-vue3`, `ag-grid-community`), Grid.js (`gridjs`).
    *   **Rich Text Editing:** (VueQuill identified in structure)
    *   **Notifications:** SweetAlert2 (`sweetalert2`), Vue Toast Notification (`vue-toast-notification`).
    *   **Real-time:** Ably (`ably`).
    *   **Utilities:** Moment.js (`moment`, `moment-timezone`), Date-fns (`date-fns`), Lodash (`lodash`), VueUse (`@vueuse/core`), Buffer (`buffer`), Form Data (`form-data`), ESBuild (`esbuild`).
    *   **Vue Ecosystem:** Vue Popper (`vue3-popper`), Vue Datepicker Next (`vue-datepicker-next`), Vue Draggable Next (`vue-draggable-next`, `vue3-draggable`), Vue Highlight.js (`vue-highlightjs`), Vue PDF Embed (`vue-pdf-embed`), Vue Spinner (`vue-spinner`), Vue UUID (`vue-uuid`), Vue Loading Overlay (`vue3-loading-overlay`), Vue Perfect Scrollbar (`vue3-perfect-scrollbar`).
    *   **Video/Audio:** Video.js (`@videojs-player/vue`, `video.js`), Vue Audio Visual (`vue-audio-visual`).
    *   **Other UI:** Flowbite (`flowbite`), Swiper (`swiper`), HTML2Canvas (`html2canvas`), jsPDF (`jspdf`).

### 5.2 Project Structure (Frontend)

```
.
├── .git/                 # Git repository data
├── .vscode/              # VSCode settings (extensions.json, settings.json)
├── dist/                 # Build output directory (generated by 'npm run build')
├── node_modules/         # Project dependencies (managed by npm)
├── public/               # Static assets served directly
│   ├── favicon.png
│   ├── notification.mp3
│   ├── whatsapp.mp3
│   └── wibi.js
├── src/                  # Main application source code
│   ├── assets/           # Static assets processed by Vite
│   │   ├── css/          # Specific CSS files (...)
│   │   ├── images/       # Image assets (...)
│   │   └── main.css      # Main global stylesheet
│   ├── components/       # Reusable Vue components (organized by feature)
│   │   ├── analytics/
│   │   ├── customers/    # Includes ApplianceCard, CommPrefsModal, PrefTechModal, etc.
│   │   ├── editor/
│   │   ├── email/
│   │   ├── employees/
│   │   ├── estimates/
│   │   ├── expenses/
│   │   ├── insurance/
│   │   ├── invoices/
│   │   ├── jobs/         # Includes JobFormModal, Job (component), etc.
│   │   ├── line-items/
│   │   ├── misc/
│   │   ├── notes/
│   │   ├── notification/
│   │   ├── payments/
│   │   ├── public/
│   │   ├── transactions/
│   │   ├── whatsapp/
│   │   └── ... (core components like AppNav, Header, Modals)
│   ├── helpers/          # Utility functions and modules
│   ├── router/           # Vue Router configuration
│   │   └── index.js      # Route definitions and navigation guards
│   ├── stores/           # Pinia state management stores
│   │   └── UserStore.js  # Store for user session and permissions
│   ├── views/            # Page-level components (mapped to routes)
│   │   ├── Customers/    # Includes View.vue (Customer View / Engagement Hub)
│   │   └── ... (other views)
│   ├── App.vue           # Root Vue component (contains RouterView)
│   └── main.js           # Application entry point (Vue initialization, plugins)
├── .gitattributes        # Git attributes configuration
├── .gitignore            # Specifies intentionally untracked files for Git
├── index.html            # Main HTML file template for Vite
├── package-lock.json     # Records exact dependency versions
├── package.json          # Project metadata and dependencies
├── postcss.config.js     # PostCSS configuration (used by Tailwind)
├── README.md             # This file
├── tailwind.config.js    # Tailwind CSS configuration
├── vercel.json           # Vercel deployment configuration
└── vite.config.js        # Vite build tool configuration
```
*(Note: CSS and Image lists truncated for brevity)*

### 5.3 Key Architectural Points (Frontend)

*   **Modularity:** The codebase is organized by feature, with dedicated folders for views and components related to specific modules (e.g., `src/views/Customers`, `src/components/customers`). The `src/views/Customers/View.vue` component acts as the central hub for the enhanced customer view and engagement features.
*   **Composition API:** Vue 3's Composition API is used extensively for organizing component logic.
*   **Component Complexity:** The `src/views/Customers/View.vue` component has become extremely large and complex, managing numerous responsibilities (customer details, related records, activity timeline, multiple AI features, modals). This significantly impacts maintainability. **Recommendation:** Urgently refactor `View.vue` into smaller, single-responsibility components (e.g., `CustomerDetailCard`, `EngagementHub`, `RelatedItemsList`, `ActivityTimeline`) to improve code structure and readability.
*   **State Management:** Centralized user state management in `UserStore.js` using Pinia. State related to specific views (like customer data, suggestions, alerts in `View.vue`) is primarily managed locally within the component using `ref` and `reactive`. **Recommendation:** Leverage Pinia more extensively for shared state (customer data, related entities, AI results) to simplify complex components like `View.vue`, improve state predictability, and facilitate testing.
*   **API Interaction:** Axios is used for backend communication. API calls are made directly from component logic (e.g., within `onMounted` or specific action handler functions like `fetchFollowupSuggestions`). The base URL is set globally in `main.js`.
*   **Authentication Flow:**
    1.  User attempts to access a route.
    2.  `router.beforeEach` guard in `src/router/index.js` checks if the route requires authentication and if the user is logged in (via `localStorage` and `UserStore`).
    3.  If auth is required but the user is not logged in, they are redirected to `/authenticate`.
    4.  If the route has specific permission requirements (`meta.permission`), the guard checks the user's role from `UserStore`. Access is denied via redirection if permissions don't match.
    5.  Otherwise, navigation proceeds.
*   **Deployment:** The presence of `vercel.json` suggests the project is intended for deployment on Vercel.

## 6. Setup & Running

### 6.1 Recommended IDE Setup

*   [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
*   For backend development, ensure Node.js and npm/yarn are installed.

### 6.2 Environment Variables

Both frontend and backend require environment variables.

*   **Frontend (`wibiclick-frontend-vue/.env`):**
    *   `VITE_API_URL`: The base URL of the running backend API (e.g., `http://localhost:8000` for local development, `https://wibi.wilbertzgroup.com/` for production).
    *   `VITE_ABLY_API_KEY`: API key for the Ably real-time service.
    *   *(Add any other frontend-specific variables)*
*   **Backend (`wibiclick_mysql_backend/.env`):**
    *   `SUPABASE_DATABASE`: PostgreSQL connection string (from Supabase or other provider).
    *   `SHADOW_DATABASE_URL`: Connection string for Prisma's shadow database (used during migrations).
    *   `PORT`: Port for the backend server (e.g., `8000`).
    *   `JWT_SECRET`: Secret key for signing JWT authentication tokens.
    *   `N8N_LLM_WEBHOOK_URL`: Full URL for the external AI service webhook (e.g., `https://n8n.wilbertzgroup.com/webhook/llm-calls`).
    *   `WHATSAPP_API_URL`: Base URL for the external WhatsApp sending API.
    *   `DEFAULT_FROM_EMAIL`: Default "From" address for emails sent via n8n.
    *   `ADMIN_EMAIL_FALLBACK`: Email address to notify if WhatsApp sending fails.
    *   `ABLY`: API key for the Ably real-time service (used by backend for publishing).
    *   `CLOUD_RUN_SERVICE_URL`: (For Production/Staging) The URL of the deployed Cloud Run service, used for OIDC token verification by scheduled tasks.
    *   *(Add any other backend-specific variables, e.g., API keys for SMS provider if implemented)*

*Note: `.env` files should **not** be committed to version control.* Create them locally based on `.env.example` files if they exist, or configure them directly in your deployment environment.

### 6.3 Project Setup

1.  **Backend (`wibiclick_mysql_backend`):**
    *   Navigate to the backend project directory.
    *   Create a `.env` file and populate it with the necessary variables (especially database URLs).
    *   Install dependencies: `npm install`
    *   Run database migrations: `npx prisma migrate dev`
    *   Generate Prisma client: `npx prisma generate` (usually run automatically by migrate)
2.  **Frontend (`wibiclick-frontend-vue`):**
    *   Navigate to the frontend project directory.
    *   Create a `.env` file and set `VITE_API_URL` to point to your running backend.
    *   Install dependencies: `npm install`

### 6.4 Running for Development

1.  **Backend:**
    *   Start the backend server: `npm run dev` (or `npm start`, check `package.json`)
    *   The server will typically run on the port specified in `.env` (e.g., `http://localhost:8000`).
2.  **Frontend:**
    *   Start the frontend dev server: `npm run dev` (or `npm run start`)
    *   The frontend will typically run on port `3001` (check `package.json` or Vite config) - e.g., `http://localhost:3001`.
    *   Access the application in your browser at the specified frontend URL.

### 6.5 Building for Production

1.  **Frontend:**
    *   Run the build command: `npm run build`
    *   This creates optimized static assets in the `dist/` directory.
2.  **Backend:**
    *   The backend needs to be built if using TypeScript compilation: `npm run build` (check `package.json` for the exact command).
    *   The build output (likely in a `dist/` directory) and `node_modules` are needed for deployment. Alternatively, use a Dockerfile for containerized deployment.

### 6.6 Deployment

*   **Frontend:** The static assets in the frontend's `dist/` directory can be deployed to any static hosting provider (like Vercel, Netlify, Firebase Hosting, Google Cloud Storage). The `vercel.json` file suggests Vercel is a target platform.
*   **Backend:** The backend application can be deployed to various platforms like Google Cloud Run (suggested by OIDC setup), Heroku, AWS EC2/ECS, etc. Ensure all necessary environment variables are configured in the deployment environment. Containerizing with Docker (using the `Dockerfile`) is a common approach.
*   **Scheduled Tasks:** Configure Cloud Scheduler (or the target platform's equivalent) to make authenticated HTTP requests to the deployed backend's `/tasks/...` endpoints according to the desired schedule.

## 7. Future Enhancements & Towards 99% AI Automation

While the current system implements significant AI features and automation, achieving the goal of a nearly self-operational (99% AI-controlled) system requires further enhancements. Key areas for future development include:

### 7.1 Deeper Insights & Prediction

*   **Real-time Sentiment Tracking:** Move beyond on-demand analysis to continuous, event-driven sentiment scoring after each interaction. Implement automated alerting and task creation based on significant sentiment changes or negative keyword detection.
*   **Continuous Profitability Monitoring:** Automate the recalculation of customer profitability scores based on job completion and financial events. Use these scores to dynamically influence engagement strategies (follow-up frequency, offers).
*   **Predictive Churn Modeling:** Develop and integrate a dedicated model to predict customer churn risk, enabling proactive retention efforts driven by AI-generated tasks or communication suggestions.

### 7.2 Increased Engagement Autonomy

*   **Automated Survey Response Processing:** Enhance AI capabilities to parse simple survey feedback (e.g., extract ratings, acknowledge positive comments) automatically, only escalating complex or negative feedback for human review.
*   **Autonomous Communication Scheduling/Sending:** Grant AI the autonomy to schedule and send routine, low-risk communications (standard follow-ups, maintenance reminders, greetings) based on predefined rules and optimal timing, reducing the need for manual approval on every item.
*   **Backend Occasion Intelligence:** Shift all logic for detecting customer milestones (birthdays, anniversaries) and relevant public holidays to backend scheduled tasks, allowing the system to proactively generate and schedule greetings without frontend dependency.
*   **Intelligent Task Management:** Implement automated task creation with clear objectives, deadlines, and potentially intelligent assignment to staff based on roles, workload, or skills. AI could also track task progress and send reminders.

### 7.3 Enhanced Service Automation

*   **Automated Service Initiation & Scheduling:** Allow AI to handle the initial steps of service booking based on predictive alerts. This includes notifying the customer, proposing appointment slots (integrated with technician calendars), handling basic confirmation/rescheduling via chat, and creating draft job records.
*   **Dynamic & Optimized Dispatch:** Integrate technician matching with real-time data (location, calendar availability, traffic) for fully optimized, potentially automated, dispatch and scheduling adjustments.
*   **Automated Parts Procurement:** Enable AI to identify needed parts from predictive maintenance, check supplier availability/pricing (via APIs or scraping), and generate draft purchase orders for approval, streamlining the parts procurement process.

### 7.4 Foundational Improvements

*   **Event-Driven Architecture:** Transition more backend processes from purely time-based schedules to an event-driven model (e.g., using internal event emitters or a message queue) for more immediate and reactive automation (e.g., job completion triggers survey task).
*   **AI Model Fine-tuning:** Explore fine-tuning the underlying LLM(s) on anonymized WibiClick data to improve the accuracy, relevance, and domain-specificity of generated insights, suggestions, and communications.
*   **Automated Testing & Monitoring:** Implement comprehensive automated testing suites (unit, integration, end-to-end) for both frontend and backend. Explore AI-driven monitoring of system logs and performance to proactively identify and potentially self-heal issues.
*   **API Documentation Automation:** Integrate tools to automatically generate and maintain API documentation (e.g., Swagger/OpenAPI) from backend code.
*   **Simplified Local Development:** Create a `docker-compose.yml` setup to allow developers to easily spin up the entire development environment (frontend, backend, database) with a single command.

By pursuing these enhancements, WibiClick can move significantly closer to the vision of a highly automated, AI-driven platform that delivers exceptional, proactive customer service with minimal manual intervention.

## 8. License

This project is licensed under the WibiClick Commercial License. See the [LICENSE](LICENSE) file for details.

### Commercial Use

**⚠️ IMPORTANT: Commercial use of this software requires a paid license.**

- **Individual Commercial License**: $500 USD per deployment/instance
- **Enterprise License**: $2,500 USD annually (unlimited deployments)
- **SaaS/Hosting Provider License**: 5% of gross revenue from services using this software

For licensing inquiries and payments, contact: mrwilbertmuza@gmail.com

### Free Use

This software may be used for:
- Personal learning and education
- Non-commercial research and development
- Academic purposes

Any commercial deployment, including but not limited to providing services to customers, incorporating into commercial products, or business operations, requires a paid commercial license.

### Getting a Commercial License

1. Contact mrwilbertmuza@gmail.com with your use case
2. Receive license agreement and payment instructions
3. Upon payment, receive license key and commercial use authorization
4. Deploy with confidence knowing you're fully licensed

**Unauthorized commercial use will result in legal action and damages equal to 10x the applicable licensing fee plus legal costs.**
