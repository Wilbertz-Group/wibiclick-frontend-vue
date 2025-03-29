# Backend Implementation Plan for Customer View Enhancements

This plan outlines the necessary backend changes, including database schema modifications, API endpoint creation/updates, and integration with external services like LLMs and messaging platforms, to support the enhanced frontend Customer View (`src/views/Customers/View.vue`).

---

## Phase 1: Backend Foundation & Core Data

This phase focuses on establishing the necessary data structures and basic API endpoints to support the initial display of enhanced customer information.

**1. Data Model Updates (Prisma Schema - `schema.prisma`)**

*   **Enhance `Payment` Model:**
    *   Add `paymentMethod: String?` (Consider using an Enum: `PaymentMethod { CASH CARD TRANSFER ... }`).
*   **Update `Expense` Model:**
    *   Add optional relations: `customerId Int?`, `customer Customer? @relation(fields: [customerId], references: [id])`, `jobId Int?`, `job Job? @relation(fields: [jobId], references: [id])`.
    *   Add appropriate database indices (`@@index([customerId])`, `@@index([jobId])`).
*   **Create `Appliance` Model:**
    ```prisma
    model Appliance {
      id              Int       @id @default(autoincrement())
      customerId      Int
      customer        Customer  @relation(fields: [customerId], references: [id])
      type            String
      brand           String?
      modelNumber     String?
      serialNumber    String?
      lastServiceDate DateTime?
      jobId           Int?      // Optional: Link to the last service job
      job             Job?      @relation(fields: [jobId], references: [id])
      createdAt       DateTime  @default(now())
      updatedAt       DateTime  @updatedAt

      @@index([customerId])
      @@index([jobId])
    }
    ```
*   **Create `Review` Model:**
    ```prisma
    model Review {
      id           Int        @id @default(autoincrement())
      jobId        Int
      job          Job        @relation(fields: [jobId], references: [id])
      customerId   Int
      customer     Customer   @relation(fields: [customerId], references: [id])
      technicianId Int
      technician   Technician @relation(fields: [technicianId], references: [id]) // Assuming Technician model exists
      rating       Int        // e.g., 1-5
      comment      String?
      createdAt    DateTime   @default(now())

      @@index([jobId])
      @@index([customerId])
      @@index([technicianId])
    }
    ```
*   **Enhance `Customer` Model for Referrals:**
    *   Add: `referredById Int?`, `referredBy Customer? @relation("Referrals", fields: [referredById], references: [id])`, `referrals Customer[] @relation("Referrals")`, `referralCode String? @unique`.
*   **Enhance `Customer` Model for Technician Preference:**
    *   Add: `preferredTechnicianId Int?`, `preferredTechnician Technician? @relation(fields: [preferredTechnicianId], references: [id])`.
*   **Create `CustomerTechnicianRating` Model:**
    ```prisma
    model CustomerTechnicianRating {
      id           Int        @id @default(autoincrement())
      customerId   Int
      customer     Customer   @relation(fields: [customerId], references: [id])
      technicianId Int
      technician   Technician @relation(fields: [technicianId], references: [id])
      jobId        Int        // Link rating to a specific job interaction
      job          Job        @relation(fields: [jobId], references: [id])
      rating       Int        // e.g., 1-5, specific to this interaction
      createdAt    DateTime   @default(now())

      @@index([customerId])
      @@index([technicianId])
      @@index([jobId])
    }
    ```
*   **Create `ServiceFollowUp` Model:**
    ```prisma
    model ServiceFollowUp {
      id                 Int       @id @default(autoincrement())
      jobId              Int
      job                Job       @relation(fields: [jobId], references: [id])
      customerId         Int
      customer           Customer  @relation(fields: [customerId], references: [id])
      status             String    // Consider Enum: FollowUpStatus { PENDING COMPLETED NO_RESPONSE SENT ... }
      satisfactionRating Int?
      feedback           String?
      followUpDate       DateTime? // Date the follow-up is scheduled/occurred
      createdAt          DateTime  @default(now())

      @@index([jobId])
      @@index([customerId])
    }
    ```
*   **Enhance `Customer` Model for Communication Preferences:**
    *   Add: `preferredContactMethod String?` (Enum: `ContactMethod { WHATSAPP EMAIL PHONE SMS }`), `preferredContactTimes String?` (Store as JSON string: `{"weekdays": ["morning", "afternoon"], "weekends": ["any"]}` or similar), `communicationFrequencyPreference String?` (Enum: `Frequency { MINIMAL MODERATE FREQUENT }`), `languagePreference String? @default("en")`.

**2. Database Migration**

*   Run `npx prisma migrate dev --name enhance-customer-view` (or your migration command).
*   Run `npx prisma generate` to update the Prisma client.

**3. API Endpoint Implementation/Updates**

*   **Payments (`/payments`):**
    *   Update `POST` and `PUT /:id` to handle `paymentMethod`.
    *   Ensure `GET` endpoints return `paymentMethod`.
*   **Expenses (`/expenses`):**
    *   Update `POST` and `PUT /:id` to handle optional `customerId` and `jobId`.
*   **Customer (`GET /customers/:id`):**
    *   **Crucially**, update this endpoint to return all newly related data needed by the frontend view. Use Prisma's `include` or `select` options efficiently:
        *   `payments` (with `paymentMethod`)
        *   `expenses` (where `customerId` matches)
        *   `appliances`
        *   `jobs` (including nested `reviews`, job-specific `expenses`, and `technician` details)
        *   `reviews` (where `customerId` matches, if needed separately from jobs)
        *   `referredBy: { select: { id: true, name: true } }`
        *   `referrals: { select: { id: true, name: true } }`
        *   `preferredTechnician: { select: { id: true, name: true } }`
        *   `customerTechnicianRatings`
        *   Communication preference fields (`preferredContactMethod`, etc.)
*   **Appliances (`/appliances`):**
    *   Implement full CRUD: `GET /?customerId=:id`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.
*   **Reviews (`/reviews`):**
    *   Implement: `POST /`, `GET /?jobId=:id`, `GET /?customerId=:id`.
*   **Referrals (`/referrals` or `/customers`):**
    *   Implement `GET /customers/:id/referrals` (if not handled by the main customer endpoint).
*   **Financial Calculations:**
    *   Implement `GET /jobs/:id/financials` (calculate sum of related payments minus sum of related expenses).
    *   Implement `GET /customers/:id/financials` (calculate sum of all customer payments minus sum of all related expenses - both direct and job-related).
*   **Technician Preferences:**
    *   Implement `PUT /customers/:id/preferred-technician`.
    *   Implement `GET /customers/:id/technician-ratings`.
    *   Implement `POST /customers/:id/technician-rating`.
*   **Service Satisfaction (`/follow-ups`):**
    *   Implement `POST /`, `PUT /:id`, `GET /?customerId=:id`.
*   **Communication Preferences:**
    *   Implement `PUT /customers/:id/communication-preferences`.

---

## Phase 2: LLM Integration & Proactive Engagement

This phase builds upon the foundation by integrating LLM capabilities and background processes for proactive features.

**1. LLM Setup & Integration**

*   **Define Prompt Templates:** Store the refined prompt templates (as described in your plan) securely, likely in backend configuration or a dedicated constants file. Ensure placeholders are clear (e.g., `{{customerName}}`).
*   **LLM API Connection:**
    *   Choose and configure the SDK/client for your selected LLM provider (OpenAI, Anthropic, etc.).
    *   Store API keys securely (environment variables).
    *   Implement basic error handling and retry logic for API calls.
*   **LLM Helper Service:**
    *   Create a reusable service/module (e.g., `LlmService`) to abstract LLM interactions.
    *   Implement methods like `generateTimelineSummary(customerId)`, `generateFollowupSuggestions(customerId)`, etc. These methods will fetch necessary data, format the prompt using the templates, call the LLM API, and parse the response.
    *   Implement a caching mechanism (e.g., Redis, in-memory cache with TTL) for LLM requests to reduce latency and cost, especially for summaries or analyses that don't need real-time updates frequently.

**2. New LLM-Powered API Endpoints**

*   Implement the following endpoints, leveraging the `LlmService`:
    *   `POST /customers/:id/timeline-summary`
    *   `POST /customers/:id/followup-suggestions`
    *   `POST /customers/:id/generate-greeting` (needs logic to determine occasion)
    *   `POST /customers/:id/analyze-sentiment`
    *   `POST /customers/:id/profitability-analysis`
    *   `POST /appliances/:id/predict-maintenance` (or `POST /customers/:id/predict-maintenance` for batch)
    *   `POST /jobs/match-technician`
    *   `POST /jobs/:id/generate-survey`

**3. Background Task Scheduling**

*   **Setup Scheduler:** Integrate a job queue system (e.g., BullMQ with Redis, node-cron).
*   **Define Scheduled Jobs:**
    *   **Follow-up Suggestions:** Periodically run (e.g., daily) to generate suggestions for relevant customers. Store suggestions (perhaps in `ServiceFollowUp` or a new `Suggestion` model).
    *   **Predictive Maintenance:** Periodically run to generate/update maintenance alerts. Store results (maybe add fields to `Appliance` or a dedicated `MaintenanceAlert` model).
    *   **Post-Service Surveys:** Trigger X days after a job's `completionDate` (requires adding `completionDate` to `Job` model). This job should generate the survey message via LLM and potentially queue it for sending.
    *   **Scheduled Message Sending:** A worker process to pick up scheduled messages (from `ServiceFollowUp` or `MessageLog`) and send them via the integrated messaging service.

**4. Messaging Service Integration**

*   **Setup:** Integrate with chosen providers (Twilio, SendGrid, etc.). Configure API keys securely.
*   **Implementation:** Create a `MessagingService` to handle sending WhatsApp, SMS, or Email based on customer preference and message type. Update `ServiceFollowUp` or `MessageLog` status upon sending/failure.

**5. Follow-up Management API Updates**

*   Ensure `POST /follow-ups` can store scheduled messages and potentially link to LLM suggestions.
*   Ensure `PUT /follow-ups/:id` can update status based on scheduler actions (e.g., 'SENT', 'FAILED').
*   Ensure `GET /follow-ups` can filter by status (e.g., 'PENDING', 'SCHEDULED', 'COMPLETED').

---