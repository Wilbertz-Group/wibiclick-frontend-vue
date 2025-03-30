# Customer View Enhancement - Progress Summary & Next Steps

**Date:** 2025-03-30

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
    *   Created `Suggestion` model with relations, indices, and related Enums (`SuggestionType`, `SuggestionSource`, `SuggestionStatus`, `SuggestionPriority`).
    *   Added `FollowUpType` Enum and `type` field to `ServiceFollowUp`, made `jobId` optional.
2.  **Database Migration:** Successfully created and applied migrations (`enhance-customer-view`, `refine-tasks-storage`, `add-suggestion-model`, `add-followup-type`).
3.  **Prisma Client:** Regenerated Prisma Client after schema changes.
4.  **API Endpoints:**
    *   **Payments (`/payments`):** Verified existing controller handles `paymentMethod`.
    *   **Expenses (`/expenses`):** Updated `POST` and `PUT` endpoints in `src/controllers/expenses.ts` to accept optional `customerId`.
    *   **Customer (`GET /customers/:id`):** Enhanced endpoint in `src/controllers/customers.ts` to include new relations (appliances, reviews, referrals, preferences, ratings, follow-ups, suggestions, etc.).
    *   **Appliances (`/appliances`):** Implemented full CRUD endpoints in `src/controllers/appliances.ts` and created `src/models/appliance.ts`. Added `POST /appliances/:id/dismiss-alert` endpoint.
    *   **Reviews (`/reviews`):** Implemented `POST`, `GET` (list), `GET /:id`, `PUT /:id`, `DELETE /:id` endpoints in `src/controllers/reviews.ts` and created `src/models/review.ts`.
    *   **Referrals:** Implemented `POST /customers/:id/link-referrer` endpoint in `src/controllers/customers.ts`. Fetching handled by `GET /customers/:id`.
    *   **Financials:** Implemented `GET /jobs/:id/financials` and `GET /customers/:id/financials` endpoints in `src/controllers/financials.ts`.
    *   **Technician Preferences:** Implemented `PUT /customers/:id/preferred-technician`, `GET /customers/:id/technician-ratings`, `POST /customers/:id/technician-rating` endpoints in `src/controllers/customers.ts` and created `src/models/customer-technician-rating.ts`.
    *   **Service Follow-ups (`/follow-ups`):** Implemented `POST`, `GET`, `PUT /:id`, `DELETE /:id` endpoints in `src/controllers/follow-ups.ts` and created `src/models/service-follow-up.ts`. Updated `POST` to handle different `type`s, `messageContent`, optional `jobId`, and `feedback`. Fixed TypeScript enum casting issues.
    *   **Communication Preferences:** Implemented `PUT /customers/:id/communication-preferences` endpoint in `src/controllers/customers.ts`.
    *   **Suggestions (`/suggestions`):** Created `src/controllers/suggestions.ts` and implemented `POST /suggestions/:id/dismiss` endpoint. Registered controller.
    *   **Messaging (`/messaging`):** Created `src/controllers/messaging.ts` and implemented `POST /messaging/send-direct` endpoint with customer lookup logic. Registered controller.

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
4.  **Background Tasks (`src/controllers/tasks.ts`):**
    *   Created controller with endpoint stubs.
    *   Implemented logic within task endpoints (`/tasks/generate-followup-suggestions`, `/tasks/generate-predictive-maintenance`, `/tasks/trigger-post-service-surveys`, `/tasks/send-scheduled-messages`) including:
        *   Data fetching (appliances, jobs, follow-ups).
        *   LLM calls.
        *   Storing LLM results (saving suggestions to `Suggestion` table, saving survey messages to `ServiceFollowUp.messageContent`).
        *   Updating `Appliance` predictive maintenance fields.
        *   Basic helper logic for `currentSeason` and `typicalMaintenanceData`.
        *   Check in `/tasks/trigger-post-service-surveys` to prevent duplicate surveys using `ServiceFollowUp` status.
    *   Registered task controller in `src/controllers/index.ts`.
5.  **Security:** Implemented OIDC token verification middleware (`schedulerAuthMiddleware`) in `src/controllers/tasks.ts` suitable for Cloud Run + Cloud Scheduler.
6.  **Messaging Service (`src/services/messaging.ts`):**
    *   Created service structure.
    *   Adapted `sendWhatsApp` to use existing logic, added outgoing message logging via `WhatsappStore`, and added fallback email error notification.
    *   Adapted `sendEmail` to use the n8n webhook.
    *   Integrated calls to this service in task controllers.
    *   Implemented customer lookup logic in `POST /messaging/send-direct`.
7.  **Code Cleanup:** Addressed numerous ESLint and TypeScript errors across modified files.

### Frontend (`wibiclick-frontend-vue`)

**Phase 1: Core Data Display**

1.  **Appliance Portfolio:** Verified existing UI section. Updated `handleDeleteAppliance` to make API call. Updated `openEditApplianceModal` signature.
2.  **Referral Tracking:** Verified existing UI section.
3.  **Job-Specific Reviews & Financials:** Verified existing display. Fixed currency formatting in `Job.vue`.
4.  **Customer Value Snapshot:** Verified existing UI section. Updated `fetchCustomerFinancials` function to call backend API. Fixed currency formatting in `View.vue`.
5.  **Technician Preference:** Verified existing UI display and modal trigger. Implemented actual API call in `PreferredTechnicianModal.vue`.
6.  **Communication Preferences:** Verified existing UI display and modal trigger.

**Phase 2: LLM Integration & Proactive Engagement**

1.  **API Calls:** Updated relevant functions (`fetchTimelineSummary`, `fetchFollowupSuggestions`, `fetchProfitabilityAnalysis`, `fetchPredictiveMaintenance`, `suggestTechnician`, `fetchServiceFollowUps`, `fetchHolidayGreetings`, `fetchScheduledMessages`, `fetchSentimentAnalysis`, `fetchLoggedFollowUps`) in `src/views/Customers/View.vue` and `src/components/jobs/JobFormModal.vue` to call the corresponding backend LLM/data endpoints.
2.  **Engagement Hub UI (`View.vue`):**
    *   Updated UI to display fetched Logged Follow-ups (`loggedFollowUps`).
    *   Updated UI to display fetched Holiday Greetings (`holidayGreetings`).
    *   Implemented `scheduleSuggestion`, `sendSuggestionNow`, `logSuggestionManually` functions to call backend endpoints.
    *   Implemented `scheduleGreeting`, `sendGreetingNow` functions to call backend endpoints.
    *   Implemented `cancelScheduledMessage` function to call backend endpoint.
    *   Implemented `dismissSuggestion` function to call backend endpoint.
    *   Added loading/error state display for AI Suggestions, Scheduled Messages, Greetings sections.
    *   Added placeholder logic for occasion detection in `fetchHolidayGreetings`.
3.  **Technician Matching UI (`JobFormModal.vue`):** Added UI to display fetched AI suggestions and allow selection. Refined TODO comment for appliance type context.
4.  **Predictive Maintenance UI:** Added action buttons (Schedule Service, Dismiss) to `ApplianceCard.vue`. Implemented `handleDismissAlert` in `View.vue` to call backend endpoint. Added loading/error state display for the Appliances section. Refined `createFollowupForAlert` placeholder function.
5.  **Code Cleanup:** Fixed corrupted function definition (`dismissPredMaintAlert`).

---

## Remaining Tasks

### Backend (`wibiclick_mysql_backend`)

1.  **Refine Task Logic (`src/controllers/tasks.ts`):**
    *   Refine data fetching logic if needed (e.g., more comprehensive service history for predictions).
    *   Review/refine LLM prompt data mapping based on testing.
2.  **Implement `MessagingService` (`src/services/messaging.ts`):**
    *   Implement actual SMS sending logic using a provider (if needed). *(Skipped for now)*
3.  **Configure Cloud Scheduler (Manual GCP Task):**
    *   Set up Cloud Scheduler jobs to trigger the `/tasks/...` endpoints on the desired schedule (daily, weekly, hourly).
    *   Configure OIDC authentication for these jobs, setting the audience to the Cloud Run service URL.
4.  **Security:** Ensure `CLOUD_RUN_SERVICE_URL` environment variable is set for OIDC verification in `schedulerAuthMiddleware`. Add any other necessary security layers (firewall rules, etc.).
5.  **Testing:** Thoroughly test all new/modified endpoints and background task logic.

### Frontend (`wibiclick-frontend-vue`)

1.  **Implement UI Components/Modals:**
    *   Implement date/time picker modal for scheduling suggestions/greetings.
    *   Implement modal for capturing feedback during manual logging of suggestions.
    *   Implement task creation modal/component to be triggered by `createFollowupForAlert`.
2.  **Refine Technician Matching UI (`JobFormModal.vue`):**
    *   Improve display of alternatives.
    *   Consider highlighting the selected suggestion.
3.  **Refine Modals:** Ensure `ApplianceFormModal`, `CommunicationPreferencesModal` are fully functional and use the corresponding backend endpoints.
4.  **Refine Occasion Logic:** Implement robust logic in `fetchHolidayGreetings` to determine relevant upcoming occasions (birthdays, anniversaries, holidays) instead of placeholders.
5.  **Implement Sentiment Analysis UI (`View.vue`):**
    *   Decide where/how to display sentiment results.
    *   Render the structured JSON response appropriately.
6.  **General:**
    *   Review and polish loading states and error handling across all new features.
    *   Address any remaining minor TODOs in the code.
    *   Perform accessibility audit and testing.
7.  **Testing:** Thoroughly test all new UI elements and interactions, ensuring correct data flow with the backend.

---