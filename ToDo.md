# Customer View Enhancement Plan

This document outlines the comprehensive plan to enhance the Customer View page (`src/views/Customers/View.vue`) to deliver a 5-star service experience by incorporating data insights and LLM-powered features.

## Overview

The enhancements focus on providing deeper customer insights, improving service quality, and enabling proactive engagement through:

1. Financial insights and profitability analysis
2. Enhanced interaction history with AI-generated summaries
3. Proactive engagement tools with LLM-suggested follow-ups
4. Comprehensive customer appliance portfolio
5. Referral tracking and management
6. Job-specific reviews and feedback
7. Detailed financial breakdowns per job
8. Personalized technician matching
9. Predictive maintenance alerts
10. Post-service satisfaction monitoring

## Phase 1: Backend Foundation & Core Data Display

### Backend Prerequisites

#### Data Model Updates (Prisma Schema)

- [ ] **Payment Model Enhancement**
  - Add `paymentMethod` (String or Enum) to track payment methods used by customers

- [ ] **Expense Model Relationships**
  - Ensure `Expense` model can be linked to both `Customer` (`customerId`) and `Job` (`jobId`)
  - Verify existing relations are properly configured

- [ ] **Appliance Model Creation**
  - Create new `Appliance` model with fields:
    - `id`: Unique identifier
    - `customerId`: Link to customer
    - `type`: Type of appliance (e.g., refrigerator, washing machine)
    - `brand`: Manufacturer
    - `modelNumber`: Optional model identifier
    - `serialNumber`: Optional serial number
    - `lastServiceDate`: Date of most recent service
    - `jobId`: Optional link to specific job

- [ ] **Review Model Creation**
  - Create new `Review` model with fields:
    - `id`: Unique identifier
    - `jobId`: Link to specific job
    - `customerId`: Link to customer
    - `technicianId`: Link to technician who performed the service
    - `rating`: Integer rating (typically 1-5)
    - `comment`: Customer feedback text
    - `createdAt`: Timestamp

- [ ] **Referral Tracking**
  - Add referral fields to `Customer` model:
    - `referredById`: Optional link to referring customer
    - `referralCode`: Optional unique code for tracking referrals
  - Consider creating a dedicated `Referral` model for more detailed tracking:
    - `id`: Unique identifier
    - `referrerId`: Customer who made the referral
    - `referredCustomerId`: New customer who was referred
    - `status`: Current status of the referral
    - `rewardGiven`: Whether a reward was provided for the referral

- [ ] **Technician Preference Tracking**
  - Add `preferredTechnicianId` to `Customer` model
  - Create `CustomerTechnicianRating` model to track customer satisfaction with specific technicians:
    - `id`: Unique identifier
    - `customerId`: Link to customer
    - `technicianId`: Link to technician
    - `rating`: Integer rating (1-5)
    - `jobId`: Link to specific job where rating was given
    - `createdAt`: Timestamp

- [ ] **Service Satisfaction Tracking**
  - Create `ServiceFollowUp` model:
    - `id`: Unique identifier
    - `jobId`: Link to completed job
    - `customerId`: Link to customer
    - `status`: Enum (Pending, Completed, No Response)
    - `satisfactionRating`: Integer (1-5)
    - `feedback`: Optional text feedback
    - `followUpDate`: When the follow-up was/should be conducted
    - `createdAt`: Timestamp

- [ ] **Customer Communication Preferences**
  - Add to `Customer` model:
    - `preferredContactMethod`: Enum (WhatsApp, Email, Phone, SMS)
    - `preferredContactTimes`: Array of time ranges
    - `communicationFrequencyPreference`: Enum (Minimal, Moderate, Frequent)
    - `languagePreference`: String for preferred language

- [ ] **Database Migration**
  - Run `prisma migrate dev` to create migration files
  - Run `prisma generate` to update the Prisma client

#### API Endpoint Updates

- [ ] **Payment Endpoints**
  - Modify `/add-payment` and `/update-payment/:id` to handle `paymentMethod`

- [ ] **Expense Endpoints**
  - Update `/add-expense` and `/expense/:id` to handle `customerId` and `jobId`

- [ ] **Customer Data Endpoint Enhancement**
  - Modify customer fetch endpoint (used by `fetchContacts` in `View.vue`) to include:
    - Payment methods in returned `payments`
    - Linked `expenses` with all necessary fields
    - Linked `appliances` data
    - Linked `reviews` (potentially nested under `jobs`)
    - Referral information (`referredById` and list of `referredCustomers`)
    - Preferred technician and technician ratings
    - Communication preferences

- [ ] **Appliance Management Endpoints**
  - Create CRUD endpoints for `Appliance` records:
    - GET `/appliances?customerId=...` - List appliances for a customer
    - GET `/appliance/:id` - Get specific appliance details
    - POST `/add-appliance` - Create new appliance record
    - PUT `/update-appliance/:id` - Update appliance details
    - DELETE `/delete-appliance/:id` - Remove appliance record

- [ ] **Review Management Endpoints**
  - Create endpoints for submitting and fetching reviews:
    - POST `/add-review` - Submit new review
    - GET `/reviews?jobId=...` - Get reviews for a specific job
    - GET `/reviews?customerId=...` - Get all reviews for a customer
    - PUT `/update-review/:id` - Update review content

- [ ] **Referral Management Endpoints**
  - Create endpoints for managing referrals:
    - GET `/referrals?referrerId=...` - List referrals made by a customer
    - GET `/referrals?referredCustomerId=...` - Get referral info for a customer
    - POST `/add-referral` - Create new referral record
    - PUT `/update-referral/:id` - Update referral status

- [ ] **Financial Calculation Endpoints**
  - Create endpoint to calculate Net Profit per Job:
    - GET `/job/:id/profit` - Calculate profit by fetching linked payments and expenses
  - Create endpoint to calculate overall Customer Net Profit:
    - GET `/customer/:id/profit` - Calculate total customer profitability

- [ ] **Technician Preference Endpoints**
  - Create endpoints for managing technician preferences:
    - POST `/customer/:id/preferred-technician` - Set preferred technician
    - GET `/customer/:id/technician-ratings` - Get customer's ratings of technicians
    - POST `/customer/:id/technician-rating` - Submit rating for a technician

- [ ] **Service Satisfaction Endpoints**
  - Create endpoints for post-service follow-ups:
    - POST `/job/:id/follow-up` - Schedule a follow-up
    - PUT `/follow-up/:id` - Update follow-up status and feedback
    - GET `/follow-ups?customerId=...` - Get all follow-ups for a customer

- [ ] **Predictive Maintenance Endpoints**
  - Create endpoint for appliance maintenance predictions:
    - GET `/appliance/:id/maintenance-prediction` - Get predicted maintenance needs
    - GET `/customer/:id/maintenance-alerts` - Get all maintenance alerts for customer

### Frontend Implementation

#### 1. Appliance Portfolio

- [ ] **Component Creation**
  - Create `ApplianceCustom.vue` component to display appliance details
  - Include fields for type, brand, model/serial numbers, and last service date
  - Add edit/delete functionality

- [ ] **UI Integration**
  - Add "Client Appliances" section/card in `View.vue` template
  - Position it appropriately in the layout (likely in the left column near Customer Details)
  - Implement responsive design for all screen sizes

- [ ] **Data Integration**
  - Fetch appliance data in the `fetchContacts` method or create a dedicated method
  - Display appliances using the new `ApplianceCustom.vue` component
  - Add button/modal to manually add appliances (similar to other entity modals)

#### 2. Referral Tracking

- [ ] **UI Creation**
  - Add "Referrals" section/card in `View.vue` template
  - Position it appropriately in the layout (likely in the left column)

- [ ] **Referral Source Display**
  - Display "Referred By" information when customer was referred by another client
  - Include referring customer name and link to their profile

- [ ] **Outgoing Referrals Display**
  - Display list of "Clients Referred" by this customer
  - Show referral status and any rewards given

#### 3. Job-Specific Reviews & Feedback

- [ ] **Component Enhancement**
  - Modify `JobCustom.vue` or the job component used in the Related Records section
  - Add star rating display (using icons or a dedicated rating component)
  - Display customer comments within the job details
  - Clearly show the assigned technician name

- [ ] **Review Submission**
  - Add functionality to submit reviews for completed jobs
  - Create a review form component or modal

#### 4. Job Financial Breakdown

- [ ] **Component Enhancement**
  - Modify `JobCustom.vue` or related job component
  - Add financial summary section within each job card

- [ ] **Financial Data Integration**
  - Fetch or calculate job-specific financials (Payments vs Expenses)
  - Display Job Payments, Job Expenses, and Job Net Profit within job details
  - Consider adding visual indicators for profitable vs. unprofitable jobs

#### 5. Customer Value & Profitability Insights (Initial)

- [ ] **UI Creation**
  - Add "Client Value Snapshot" card in `View.vue`
  - Position it prominently, possibly at the top of the left column

- [ ] **Financial Data Integration**
  - Fetch/calculate and display:
    - Total Revenue (sum of all payments)
    - Total Costs (sum of all expenses)
    - Net Profit (Revenue - Costs)
  - Add visual indicators for profitability status

#### 6. Technician Preference & Matching

- [ ] **UI Creation**
  - Add "Preferred Technician" section to Customer Details
  - Create interface for viewing and setting technician preferences

- [ ] **Data Integration**
  - Display current preferred technician (if any)
  - Show technician ratings from this customer
  - Add ability to set/change preferred technician

#### 7. Communication Preferences

- [ ] **UI Creation**
  - Add "Communication Preferences" section to Customer Details
  - Create interface for viewing and setting preferences

- [ ] **Data Integration**
  - Display and allow editing of:
    - Preferred contact method
    - Preferred contact times
    - Communication frequency preference
    - Language preference

## Phase 2: LLM Integration & Proactive Engagement

### LLM Prompt Templates

This section outlines the specific prompt templates to be used for each LLM-enhanced feature. These templates are designed to extract maximum value from the available customer data while ensuring consistent, high-quality outputs.

#### 1. Customer Value & Profitability Analysis Prompt

**Purpose**: Generate insights about customer profitability trends and provide actionable recommendations.

**Data Inputs**:
- Customer basic information (name, since date)
- Payment history (amounts, dates, methods)
- Expense history (amounts, dates, categories)
- Job history (types, dates, outcomes)

**Prompt Template**:
```
You are a financial analyst for a service business. Analyze the following customer financial data and provide a concise, insightful summary of their profitability trends and value to the business.

CUSTOMER INFORMATION:
Name: {{customer.name}}
Customer since: {{formatDate(customer.createdAt)}}
Total jobs completed: {{customer.jobs.length}}

FINANCIAL DATA:
Total Revenue: ${{totalRevenue}} (from {{customer.payments.length}} payments)
Total Expenses: ${{totalExpenses}} (from {{customer.expenses.length}} expenses)
Net Profit: ${{netProfit}}
Average Revenue per Job: ${{averageRevenuePerJob}}

PAYMENT HISTORY (Last 5):
{{#each recentPayments}}
- ${{this.amount}} on {{formatDate(this.date)}} ({{this.paymentMethod}})
{{/each}}

EXPENSE HISTORY (Last 5):
{{#each recentExpenses}}
- ${{this.amount}} on {{formatDate(this.date)}} ({{this.category}})
{{/each}}

JOB HISTORY (Last 5):
{{#each recentJobs}}
- {{this.description}} on {{formatDate(this.date)}} (Profit: ${{this.profit}})
{{/each}}

Based on this data, provide:
1. A 2-3 sentence summary of this customer's profitability trend
2. One key observation about their spending pattern
3. One actionable recommendation to increase their value
4. A profitability classification (Highly Profitable, Moderately Profitable, Break-Even, or Loss-Making)

Keep your response under 150 words, professional in tone, and focused on actionable insights.
```

**Expected Output Format**:
```
PROFITABILITY ANALYSIS:
[2-3 sentence summary of profitability trend]

KEY OBSERVATION:
[Observation about spending pattern]

RECOMMENDATION:
[Actionable recommendation]

CLASSIFICATION: [Profitability Classification]
```

#### 2. Interaction Timeline Summary Prompt

**Purpose**: Generate a concise summary of all customer interactions to provide a quick overview of the relationship history.

**Data Inputs**:
- Customer basic information
- Activity timeline (notes, WhatsApp messages, emails, etc.)
- Job history
- Payment history

**Prompt Template**:
```
You are a customer relationship analyst. Create a concise summary of the following customer interaction history, highlighting key patterns, issues, and opportunities.

CUSTOMER INFORMATION:
Name: {{customer.name}}
Customer since: {{formatDate(customer.createdAt)}}

INTERACTION HISTORY:
{{#each activities}}
- {{formatDate(this.createdAt)}} | {{this.type}}: {{this.content}}
{{/each}}

JOB HISTORY:
{{#each jobs}}
- {{formatDate(this.date)}} | {{this.description}} | Technician: {{this.technicianName}}
{{/each}}

PAYMENT HISTORY:
{{#each payments}}
- {{formatDate(this.date)}} | ${{this.amount}} | Method: {{this.paymentMethod}}
{{/each}}

Based on this history, provide:
1. A 3-4 sentence summary of the overall customer relationship
2. Key communication preferences (based on most frequent interaction types)
3. Any recurring issues or requests
4. Opportunities for improved service or upselling

Keep your response under 200 words, conversational but professional in tone, and focused on insights that would help a service technician or customer service representative better understand this customer at a glance.
```

**Expected Output Format**:
```
CUSTOMER RELATIONSHIP SUMMARY:
[3-4 sentence overview of relationship]

COMMUNICATION PREFERENCES:
[Preferred communication channels and style]

RECURRING THEMES:
[Any patterns in issues, requests, or feedback]

OPPORTUNITIES:
[Suggestions for improved service or additional sales]
```

#### 3. Proactive Engagement Suggestions Prompt

**Purpose**: Generate personalized follow-up suggestions based on customer history, appliance types, and service patterns.

**Data Inputs**:
- Customer information
- Appliance data
- Service history
- Last interaction date
- Seasonal factors

**Prompt Template**:
```
You are a customer success specialist for an appliance service company. Generate personalized follow-up suggestions for this customer based on their history and appliances.

CUSTOMER INFORMATION:
Name: {{customer.name}}
Last interaction: {{formatDate(lastInteractionDate)}}
Days since last contact: {{daysSinceLastContact}}

APPLIANCE PORTFOLIO:
{{#each appliances}}
- {{this.type}} ({{this.brand}}): Last serviced on {{formatDate(this.lastServiceDate)}}
{{/each}}

SERVICE HISTORY:
{{#each jobs}}
- {{formatDate(this.date)}} | {{this.description}} | Outcome: {{this.outcome}}
{{/each}}

CURRENT DATE: {{formatDate(currentDate)}}
UPCOMING SEASON: {{upcomingSeason}}

Based on this information, provide:
1. 2-3 specific follow-up suggestions with reasoning
2. Recommended timing for each follow-up (e.g., "Within 1 week", "In 3 months")
3. A draft message for each suggestion (2-3 sentences, conversational and personalized)

Consider:
- Seasonal maintenance needs
- Typical appliance service intervals
- Recent issues that might need checking
- Opportunities for preventative maintenance
- Customer communication preferences

Keep suggestions practical, valuable to the customer, and aligned with their specific appliances and history.
```

**Expected Output Format**:
```
FOLLOW-UP SUGGESTIONS:

1. [SUGGESTION TITLE]
   REASON: [Brief explanation of why this follow-up is valuable]
   TIMING: [When to follow up]
   DRAFT MESSAGE: 
   "Hi {{customer.name}}, [personalized follow-up message]"

2. [SUGGESTION TITLE]
   REASON: [Brief explanation of why this follow-up is valuable]
   TIMING: [When to follow up]
   DRAFT MESSAGE: 
   "Hi {{customer.name}}, [personalized follow-up message]"

3. [SUGGESTION TITLE]
   REASON: [Brief explanation of why this follow-up is valuable]
   TIMING: [When to follow up]
   DRAFT MESSAGE: 
   "Hi {{customer.name}}, [personalized follow-up message]"
```

#### 4. Holiday & Occasion Messages Prompt

**Purpose**: Generate personalized holiday greetings or service anniversary messages to strengthen customer relationships.

**Data Inputs**:
- Customer information
- Service anniversary dates
- Upcoming holidays
- Previous interactions

**Prompt Template**:
```
You are a customer relationship specialist for an appliance service company. Create a personalized holiday or occasion message for this customer.

CUSTOMER INFORMATION:
Name: {{customer.name}}
Customer since: {{formatDate(customer.createdAt)}}
Service anniversary: {{formatDate(serviceAnniversaryDate)}}
Days until service anniversary: {{daysUntilServiceAnniversary}}

RECENT INTERACTIONS:
{{#each recentActivities}}
- {{formatDate(this.date)}} | {{this.type}}: {{this.content}}
{{/each}}

UPCOMING HOLIDAYS:
{{#each upcomingHolidays}}
- {{this.name}} on {{formatDate(this.date)}} ({{this.daysAway}} days away)
{{/each}}

OCCASION TO CELEBRATE: {{occasionType}} ({{occasionName}})

Based on this information, create a warm, personalized message for the {{occasionType}}. The message should:
1. Reference the specific occasion
2. Include a personal touch based on the customer's history
3. Express appreciation for their business
4. Be warm and genuine without being overly familiar
5. Be appropriate for sending via WhatsApp or email

Keep the message between 3-5 sentences, conversational but professional, and avoid generic platitudes.
```

**Expected Output Format**:
```
OCCASION: {{occasionName}}

MESSAGE:
"Hi {{customer.name}},

[Personalized holiday/occasion message that references their specific history and expresses genuine appreciation]

Warm regards,
The [Company] Team"
```

#### 5. Sentiment Analysis Prompt

**Purpose**: Analyze customer communications to detect sentiment and identify potential issues or opportunities.

**Data Inputs**:
- Customer messages (WhatsApp, email, notes)
- Recent interactions

**Prompt Template**:
```
You are a sentiment analysis specialist. Analyze the following customer communications to determine the overall sentiment and identify any issues or opportunities.

CUSTOMER INFORMATION:
Name: {{customer.name}}

RECENT COMMUNICATIONS:
{{#each communications}}
- {{formatDate(this.date)}} | {{this.type}}: {{this.content}}
{{/each}}

For each communication, provide:
1. A sentiment score (-2 very negative, -1 somewhat negative, 0 neutral, 1 somewhat positive, 2 very positive)
2. Key themes or topics mentioned
3. Any issues or concerns expressed
4. Any opportunities for improved service

Then provide an overall analysis with:
1. Average sentiment score
2. Dominant themes across all communications
3. Most significant issues to address
4. Most promising opportunities to pursue

Keep your analysis concise, objective, and focused on actionable insights.
```

**Expected Output Format**:
```
COMMUNICATION ANALYSIS:
{{#each communications}}
- {{formatDate(this.date)}} | SENTIMENT: {{this.sentimentScore}} | THEMES: {{this.themes}}
  ISSUES: {{this.issues}}
  OPPORTUNITIES: {{this.opportunities}}
{{/each}}

OVERALL SENTIMENT: {{averageSentiment}} ({{sentimentDescription}})

DOMINANT THEMES:
- [Theme 1]
- [Theme 2]
- [Theme 3]

KEY ISSUES TO ADDRESS:
- [Issue 1]
- [Issue 2]

OPPORTUNITIES:
- [Opportunity 1]
- [Opportunity 2]
```

#### 6. Predictive Maintenance Alert Prompt

**Purpose**: Generate predictive maintenance alerts based on appliance data, usage patterns, and seasonal factors.

**Data Inputs**:
- Appliance details (type, brand, model, age)
- Service history
- Typical lifespan data
- Seasonal factors

**Prompt Template**:
```
You are a predictive maintenance specialist for appliance services. Analyze the following appliance data and service history to predict potential maintenance needs and generate appropriate alerts.

APPLIANCE INFORMATION:
Type: {{appliance.type}}
Brand: {{appliance.brand}}
Model: {{appliance.modelNumber}}
Estimated Age: {{applianceAge}} years
Last Service Date: {{formatDate(appliance.lastServiceDate)}}
Days Since Last Service: {{daysSinceLastService}}

SERVICE HISTORY:
{{#each serviceHistory}}
- {{formatDate(this.date)}} | {{this.description}} | Issues Found: {{this.issuesFound}}
{{/each}}

TYPICAL MAINTENANCE INTERVALS:
- Recommended service frequency: {{recommendedServiceFrequency}}
- Average lifespan for this type/brand: {{averageLifespan}} years
- Common failure points at age {{applianceAge}}: {{commonFailurePoints}}

SEASONAL FACTORS:
Current Season: {{currentSeason}}
Upcoming Season: {{upcomingSeason}}
Seasonal Impact on this Appliance Type: {{seasonalImpact}}

Based on this information, provide:
1. A maintenance risk assessment (Low, Medium, High)
2. Predicted maintenance needs within the next 3 months
3. Recommended preventative actions
4. Optimal timing for the next service
5. Potential cost savings from preventative vs. emergency service

Keep your analysis factual, specific to this appliance, and focused on actionable recommendations.
```

**Expected Output Format**:
```
MAINTENANCE RISK ASSESSMENT: [Low/Medium/High]

PREDICTED MAINTENANCE NEEDS:
- [Specific component or issue] - [Likelihood of failure]
- [Specific component or issue] - [Likelihood of failure]

RECOMMENDED PREVENTATIVE ACTIONS:
1. [Specific recommendation]
2. [Specific recommendation]

OPTIMAL TIMING: [Recommended timeframe for next service]

POTENTIAL COST SAVINGS: [Estimated savings from preventative maintenance]

ALERT PRIORITY: [Low/Medium/High]
```

#### 7. Technician Matching Prompt

**Purpose**: Recommend the most suitable technician for a customer based on past interactions, technician specialties, and customer preferences.

**Data Inputs**:
- Customer information and preferences
- Technician profiles and specialties
- Past technician-customer interactions
- Appliance details

**Prompt Template**:
```
You are a service coordinator for an appliance repair company. Recommend the most suitable technician for this customer based on their history, preferences, and the specific service needed.

CUSTOMER INFORMATION:
Name: {{customer.name}}
Preferred Technician (if any): {{customer.preferredTechnicianId}}

APPLIANCE REQUIRING SERVICE:
Type: {{appliance.type}}
Brand: {{appliance.brand}}
Issue: {{serviceRequest.issue}}

PAST TECHNICIAN INTERACTIONS:
{{#each pastInteractions}}
- Technician: {{this.technicianName}} | Date: {{formatDate(this.date)}} | Service: {{this.service}} | Customer Rating: {{this.rating}}/5
{{/each}}

AVAILABLE TECHNICIANS:
{{#each availableTechnicians}}
- ID: {{this.id}} | Name: {{this.name}} | Specialties: {{this.specialties}} | Experience: {{this.yearsExperience}} years
{{/each}}

Based on this information, recommend:
1. The best-matched technician for this service request
2. 1-2 alternative technicians if the primary recommendation is unavailable
3. A brief explanation of why each technician would be a good match
4. Any special notes for the assigned technician based on customer history

Consider factors such as:
- Previous positive interactions
- Technician expertise with this specific appliance/issue
- Customer's explicit preferences
- Consistency in service personnel

Provide a clear, objective recommendation focused on creating the best customer experience.
```

**Expected Output Format**:
```
PRIMARY TECHNICIAN RECOMMENDATION:
Technician: {{recommendedTechnician.name}}
Reason: [Explanation of why this technician is the best match]

ALTERNATIVE RECOMMENDATIONS:
1. {{alternativeTechnician1.name}} - [Brief explanation]
2. {{alternativeTechnician2.name}} - [Brief explanation]

SPECIAL NOTES FOR ASSIGNED TECHNICIAN:
- [Important information about customer preferences or history]
- [Specific details about the issue based on pattern recognition]
```

### Backend Prerequisites

#### LLM Service Integration

- [ ] **API Connection Setup**
  - Set up connection to an LLM API (e.g., OpenAI, Anthropic)
  - Create environment variables for API keys and endpoints
  - Implement rate limiting and error handling

- [ ] **Helper Functions**
  - Create utility functions to call the LLM with specific prompts
  - Implement prompt templates from the section above
  - Add caching mechanism to reduce API calls for similar requests

#### New API Endpoints

- [ ] **Timeline Summary Endpoint**
  - Create `POST /customer/:id/timeline-summary` endpoint
  - Implement logic to:
    - Fetch all customer activities
    - Format them into the Interaction Timeline Summary prompt
    - Call LLM to generate a concise summary
    - Return the summary text

- [ ] **Follow-up Suggestions Endpoint**
  - Create `POST /customer/:id/followup-suggestions` endpoint
  - Implement logic to:
    - Analyze customer history, appliance types, and service patterns
    - Use the Proactive Engagement Suggestions prompt
    - Generate appropriate follow-up timing and content suggestions
    - Return structured suggestions with draft messages

- [ ] **Holiday/Occasion Messages Endpoint**
  - Create `POST /customer/:id/generate-greeting` endpoint
  - Implement logic to:
    - Determine relevant occasions (holidays, service anniversaries)
    - Use the Holiday & Occasion Messages prompt
    - Generate personalized greeting messages
    - Return formatted message drafts

- [ ] **Sentiment Analysis Endpoint**
  - Create `POST /customer/:id/analyze-sentiment` endpoint
  - Implement logic to:
    - Fetch recent customer communications
    - Use the Sentiment Analysis prompt
    - Return sentiment scores and analysis

- [ ] **Profitability Analysis Endpoint**
  - Create `POST /customer/:id/profitability-analysis` endpoint
  - Implement logic to:
    - Fetch customer financial data
    - Use the Customer Value & Profitability Analysis prompt
    - Return formatted analysis with recommendations

- [ ] **Predictive Maintenance Endpoint**
  - Create `POST /appliance/:id/predict-maintenance` endpoint
  - Implement logic to:
    - Fetch appliance data and service history
    - Use the Predictive Maintenance Alert prompt
    - Return maintenance predictions and recommendations

- [ ] **Technician Matching Endpoint**
  - Create `POST /customer/:id/match-technician` endpoint
  - Implement logic to:
    - Fetch customer preferences and history
    - Use the Technician Matching prompt
    - Return recommended technicians with explanations

- [ ] **Follow-up Management Endpoints**
  - Create `POST /followups` endpoint to log manual follow-ups
  - Create `GET /followups?customerId=...` endpoint to fetch logged follow-ups

#### Background Task/Scheduling

- [ ] **Scheduler Implementation**
  - Implement a scheduler (e.g., node-cron, BullMQ) for automated tasks
  - Set up recurring jobs for follow-up reminders

- [ ] **Message Scheduling**
  - Create endpoint/mechanism to schedule an LLM-generated message for sending
  - Implement queue for scheduled messages

- [ ] **Messaging Integration**
  - Integrate with WhatsApp/Email services for automated sending
  - Implement delivery status tracking

- [ ] **Automated Post-Service Follow-ups**
  - Create scheduled task to generate follow-up messages after service completion
  - Implement logic to send satisfaction surveys at appropriate intervals

### Frontend Implementation

#### 1. Enhanced Interaction Timeline

- [ ] **UI Enhancement**
  - Add summary section in the "All" tab of the activity timeline
  - Create a visually distinct area for the LLM-generated summary
  - Add refresh button to regenerate the summary on demand

- [ ] **Data Integration**
  - Call backend endpoint to fetch the LLM summary on page load
  - Display the summary with appropriate styling
  - Add loading state during summary generation

- [ ] **Sentiment Analysis (Optional)**
  - Add UI elements to display sentiment analysis results
  - Consider color coding or icons to indicate positive/negative sentiment
  - Add tooltip explanations for sentiment indicators

#### 2. Proactive Engagement Hub

- [ ] **Section Creation**
  - Create new major section/tab in `View.vue`
  - Add to the TabGroup component alongside existing tabs
  - Design a comprehensive layout for all engagement features

- [ ] **Reminders Component**
  - Display system/rule-based reminders
  - Show due dates and priority levels
  - Add actions to dismiss or reschedule

- [ ] **LLM Suggestions Component**
  - Call backend endpoint to fetch suggested follow-ups
  - Display what to follow up about, when, and include draft messages
  - Add buttons to "Schedule", "Dismiss", or "Log Manually"

- [ ] **Scheduled Messages Component**
  - Display messages scheduled for automatic sending
  - Show scheduled date/time and status
  - Allow cancellation or rescheduling

- [ ] **Logged Follow-ups Component**
  - Fetch and display manually logged follow-ups
  - Show technician name and date
  - Add form/button to log new manual follow-up

- [ ] **Holiday/Occasion Messages Component**
  - Call backend endpoint to fetch drafted greeting messages
  - Display messages for review
  - Add buttons to send immediately or schedule

#### 3. Customer Value & Profitability Insights (LLM Enhanced)

- [ ] **LLM Integration**
  - Call backend endpoint to fetch LLM-generated profitability trend summary
  - Update the "Client Value Snapshot" card to include the AI analysis
  - Add visual indicators for trends (improving/declining)

- [ ] **UI Refinement**
  - Display the LLM summary text with appropriate styling
  - Consider adding expandable sections for detailed analysis
  - Include refresh button to regenerate analysis

#### 4. Predictive Maintenance Alerts

- [ ] **UI Creation**
