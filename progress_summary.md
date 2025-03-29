# Customer View Enhancement - Progress Summary & Next Steps

**Date:** 2025-03-29

**Objective:** Enhance the Customer View page (`wibiclick-frontend-vue`) to provide a comprehensive, data-driven, and proactive 5-star service experience by integrating detailed customer insights, financial metrics, relationship history, and LLM-powered features, supported by the `wibiclick_mysql_backend`.

---

## Accomplishments

### Backend (`wibiclick_mysql_backend`)

**Phase 1: Foundation & Core Data**

1.  **Schema (`prisma/schema.prisma`):**
    *   Enhanced `Payment` model (added `paymentMethod`).
    *   Enhanced `Expense` model (added `customerId`, `jobId` relations & indices).
    *   Created `Appliance` model with relations & indices.
    *   Created `Review` model with relations & indices.
    *   Enhanced `Customer` model for Referrals (`referredById`, `referrals`, `referralCode`).
    *   Enhanced `Customer` model for Technician Preference (`preferredTechnicianId`, `preferredTechnician` relation).
    *   Created `CustomerTechnicianRating` model with relations & indices.
    *   Created `ServiceFollowUp` model with relations & indices.
    *   Enhanced `Customer` model for Communication Preferences (`preferredContactMethod`, `preferredContactTimes`, `communicationFrequencyPreference`, `languagePreference`).
    *   Added `FollowUpStatus` Enum.
2.  **Database Migration:** Successfully created and applied migrations (`enhance-customer-view`, `refine-tasks-storage`).
3.  **Prisma Client:** Regenerated Prisma Client after schema changes.
4.  **API Endpoints:**
    *   **Payments (`/payments`):** Verified existing controller handles `paymentMethod`.
    *   **Expenses (`/expenses`):** Updated `POST` and `PUT` endpoints in `src/controllers/expenses.ts` to accept optional `customerId`.
    *   **Customer (`GET /customers/:id`):** Enhanced endpoint in `src/controllers/customers.ts` to include new relations (appliances, reviews, referrals, preferences, ratings, follow-ups, etc.).
    *   **Appliances (`/appliances`):** Implemented full CRUD endpoints in `src/controllers/appliances.ts` and created `src/models/appliance.ts`.
    *   **Reviews (`/reviews`):** Implemented `POST`, `GET` (list), `GET /:id`, `PUT /:id`, `DELETE /:id` endpoints in `src/controllers/reviews.ts` and created `src/models/review.ts`.
    *   **Referrals:** Implemented `POST /customers/:id/link-referrer` endpoint in `src/controllers/customers.ts`. Fetching handled by `GET /customers/:id`.
    *   **Financials:** Implemented `GET /jobs/:id/financials` and `GET /customers/:id/financials` endpoints in `src/controllers/financials.ts`.
    *   **Technician Preferences:** Implemented `PUT /customers/:id/preferred-technician`, `GET /customers/:id/technician-ratings`, `POST /customers/:id/technician-rating` endpoints in `src/controllers/customers.ts` and created `src/models/customer-technician-rating.ts`.
    *   **Service Follow-ups (`/follow-ups`):** Implemented `POST`, `GET`, `PUT /:id`, `DELETE /:id` endpoints in `src/controllers/follow-ups.ts` and created `src/models/service-follow-up.ts`.
    *   **Communication Preferences:** Implemented `PUT /customers/:id/communication-preferences` endpoint in `src/controllers/customers.ts`.

**Phase 2: LLM Integration & Background Tasks**

1.  **LLM Prompts:** Defined all required prompt templates in `src/config/llm-prompts.ts`.
2.  **LLM Service:** Created `src/services/llm-service.ts` configured to interact with the specified n8n webhook (`https://n8n.wilbertzgroup.com/webhook/llm-calls`), expecting `{ "output": ... }` response format.
3.  **LLM API Endpoints:** Implemented all LLM-related endpoints in the relevant controllers (`customers.ts`, `appliances.ts`, `jobs.ts`), leveraging the `LlmService`.
    *   `POST /customers/:id/timeline-summary`
    *   `POST /customers/:id/followup-suggestions`
    *   `POST /customers/:id/generate-greeting`
    *   `POST /customers/:id/analyze-sentiment`
    *   `POST /customers/:id/profitability-analysis`
    *   `POST /appliances/:id/predict-maintenance`
    *   `POST /jobs/match-technician`
    *   `POST /jobs/:id/generate-survey`
4.  **Background Tasks:**
    *   Created `src/controllers/tasks.ts` with endpoint stubs for scheduled tasks.
    *   Implemented basic logic within task endpoints (`/tasks/generate-followup-suggestions`, `/tasks/generate-predictive-maintenance`, `/tasks/trigger-post-service-surveys`, `/tasks/send-scheduled-messages`) including data fetching, LLM calls, and placeholder actions.
    *   Registered task controller in `src/controllers/index.ts`.
5.  **Security:** Implemented OIDC token verification middleware (`schedulerAuthMiddleware`) in `src/controllers/tasks.ts` suitable for Cloud Run + Cloud Scheduler.
6.  **Messaging Service:** Created basic `src/services/messaging.ts` structure, adapted `sendWhatsApp` to use existing logic from `whatsapp.ts`, adapted `sendEmail` to use the n8n webhook, removed Twilio/SendGrid placeholders. Integrated calls to this service in task controllers.
7.  **Code Cleanup:** Addressed numerous ESLint and TypeScript errors across modified files.

### Frontend (`wibiclick-frontend-vue`)

**Phase 1: Core Data Display**

1.  **Appliance Portfolio:** Verified existing UI section in `src/views/Customers/View.vue` using the `src/components/Customers/ApplianceCard.vue` component. Updated `handleDeleteAppliance` to make API call. Updated `openEditApplianceModal` signature.
2.  **Referral Tracking:** Verified existing UI section in `src/views/Customers/View.vue`.
3.  **Job-Specific Reviews & Financials:** Verified existing display within `src/components/jobs/Job.vue`.
4.  **Customer Value Snapshot:** Verified existing UI section in `src/views/Customers/View.vue`. Updated `fetchCustomerFinancials` function to call backend API.
5.  **Technician Preference:** Verified existing UI display and modal trigger in `src/views/Customers/View.vue`.
6.  **Communication Preferences:** Verified existing UI display and modal trigger in `src/views/Customers/View.vue`.

**Phase 2: LLM Integration & Proactive Engagement**

1.  **API Calls:** Updated relevant functions (`fetchTimelineSummary`, `fetchFollowupSuggestions`, `fetchProfitabilityAnalysis`, `fetchPredictiveMaintenance`, `suggestTechnician`, `fetchServiceFollowUps`, `fetchHolidayGreetings`) in `src/views/Customers/View.vue` and `src/components/jobs/JobFormModal.vue` to call the corresponding backend LLM/data endpoints.
2.  **Engagement Hub UI:**
    *   Updated UI to display fetched Logged Follow-ups (`loggedFollowUps`).
    *   Updated UI to display fetched Holiday Greetings (`holidayGreetings`) with placeholder actions.
    *   Confirmed AI Suggestions section calls placeholder actions.
    *   Updated placeholder text for Scheduled Messages.
3.  **Technician Matching UI:** Added UI in `src/components/jobs/JobFormModal.vue` to display fetched AI suggestions and allow selection.
4.  **Predictive Maintenance UI:** Added placeholder action buttons (Schedule Service, Dismiss) to `src/components/Customers/ApplianceCard.vue` and corresponding event handlers in `src/views/Customers/View.vue`.

---

## Remaining Tasks

### Backend (`wibiclick_mysql_backend`)

1.  **Refine Task Logic (`src/controllers/tasks.ts`):**
    *   Implement logic to **store/use LLM results** (suggestions, predictions, generated messages) - e.g., save suggestions to a new `Suggestion` table or update `ServiceFollowUp`, update `Appliance` with prediction data.
    *   Refine data fetching logic within tasks (e.g., filter customers/appliances more effectively, get better service history for predictions).
    *   Implement logic for determining `currentSeason`, `typicalMaintenanceData`.
    *   Implement logic to get actual `messageContent` for scheduled follow-ups (likely needs storing when created/scheduled).
    *   Add checks in `/tasks/trigger-post-service-surveys` to prevent sending duplicate surveys (e.g., check `ServiceFollowUp` status).
2.  **Implement `MessagingService` (`src/services/messaging.ts`):**
    *   Implement actual SMS sending logic using a provider (if needed).
    *   Add optional logging for outgoing WhatsApp messages (similar to `whatsapp.ts`).
    *   Add more robust error handling/fallbacks.
3.  **Configure Cloud Scheduler (Manual GCP Task):**
    *   Set up Cloud Scheduler jobs to trigger the `/tasks/...` endpoints on the desired schedule (daily, weekly, hourly).
    *   Configure OIDC authentication for these jobs, setting the audience to the Cloud Run service URL.
4.  **Security:** Ensure `CLOUD_RUN_SERVICE_URL` environment variable is set for OIDC verification in `schedulerAuthMiddleware`. Add any other necessary security layers.
5.  **Testing:** Thoroughly test all new endpoints and task logic.

### Frontend (`wibiclick-frontend-vue`)

1.  **Implement Placeholder Actions:**
    *   **AI Suggestions:** Implement `scheduleSuggestion`, `sendSuggestionNow`, `logSuggestionManually` functions in `View.vue` (may require backend changes or new modals).
    *   **Predictive Alerts:** Implement `handleScheduleServiceFromAlert` in `View.vue` (likely involves pre-filling and opening `JobFormModal.vue`). Implement backend call for `handleDismissAlert` if persistence is needed.
    *   **Greetings:** Implement Schedule/Send actions for greetings.
2.  **Refine Technician Matching UI (`JobFormModal.vue`):**
    *   Improve display of alternatives.
    *   Consider highlighting the selected suggestion.
3.  **Implement Scheduled Messages UI (`View.vue`):**
    *   Fetch and display messages marked as 'SCHEDULED' (requires backend filtering/logic).
    *   Potentially allow cancellation.
4.  **Implement Sentiment Analysis UI (`View.vue`):**
    *   Decide where/how to display sentiment results.
    *   Add function to call the `analyze-sentiment` endpoint.
    *   Render the structured JSON response appropriately.
5.  **Refine Modals:** Ensure `ApplianceFormModal`, `PreferredTechnicianModal`, `CommunicationPreferencesModal` are fully functional and use the corresponding backend endpoints created in Phase 1.
6.  **General:**
    *   Improve loading states and error handling across all new features.
    *   Address any remaining TODOs in the code.
    *   Perform accessibility audit and testing.
7.  **Testing:** Thoroughly test all new UI elements and interactions.

---