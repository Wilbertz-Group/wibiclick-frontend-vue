# WibiClick Frontend (Vue)

This is the frontend application for WibiClick, built using Vue 3 and Vite.

## Project Overview

WibiClick is a comprehensive business management application featuring modules for:

*   **Core Functionality:** Dashboard, User Profiles, Authentication, Settings, Billing, Feedback.
*   **Customer Relationship Management (CRM):** Managing Customers/Contacts, Jobs, Employees, Suppliers, and Notes.
*   **Financial Management:** Creating and managing Invoices, Estimates, Payments, and Expenses.
*   **Specialized Modules:** Insurance Reports, Visitor Tracking, Form Building, Page Management, Code Snippets.
*   **Administration:** User Management, Application Settings.
*   **Role-Based Access:** Different dashboards and feature access for Admins, Technicians, and Employees.

## Tech Stack

*   **Framework:** Vue 3 (with Composition API)
*   **Build Tool:** Vite
*   **Routing:** Vue Router
*   **State Management:** Pinia (with `pinia-plugin-persistedstate` for local storage persistence)
*   **Styling:** Tailwind CSS (with PostCSS)
*   **HTTP Client:** Axios (configured to connect to `https://wibi.wilbertzgroup.com/`)
*   **UI Components & Libraries:**
    *   FormKit (for forms)
    *   Headless UI
    *   Heroicons
    *   FontAwesome
    *   ApexCharts & Chart.js (for data visualization)
    *   AG Grid (for data grids)
    *   Quill Editor (for rich text editing)
    *   SweetAlert2 (for notifications/alerts)
    *   Vue Toast Notification
    *   And various others for specific features (date pickers, drag & drop, PDF embedding, etc.)
*   **Real-time:** Ably (likely for real-time updates or communication)

## Key Features & Structure

*   **Modular Design:** Features are organized into distinct views and components (e.g., `src/views/Invoices`, `src/components/AppNav.vue`).
*   **Authentication & Authorization:** Uses Vue Router's navigation guards (`beforeEach`) to protect routes based on login status and user permissions stored in the Pinia `UserStore`.
*   **API Integration:** Uses Axios to communicate with the backend API.
*   **State Persistence:** User session and potentially other state are persisted in local storage via Pinia.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run start # Runs on port 3001 by default
# or
npm run dev   # Alias for npm run start
```

### Compile and Minify for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview # Runs on port 4173 by default
