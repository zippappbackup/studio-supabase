# Zipp Super App

This is a modular super-app designed to connect users with local service vendors. It includes features for user authentication, vendor profiles, service offerings, promotions, and an administrative backend for management.

---

## "I Have a Problem" Feature - End-to-End Implementation Plan

This document outlines the detailed, step-by-step plan to build the "I Have a Problem" feature based on a 100% in-browser AI architecture.

### **Core Architecture & Tools**

This feature will be built using three distinct, free-to-use components that work together seamlessly:

1.  **The AI Brain (Puter.js):** A lightweight, client-side AI for all text analysis and reasoning tasks. It runs entirely in the user's browser, requiring no API key and incurring no cost to the developer.
2.  **The AI Eyes (YOLOv8n via ONNX Runtime):** An ultra-fast, small (~5MB) object detection model that runs in the browser. It will identify generic objects in user-submitted photos.
3.  **The Knowledge Base (WikiHow Proxy):** A server-side Cloud Function that acts as a secure proxy to fetch step-by-step DIY guides from the WikiHow API, providing the core instructional content.

### **Phase 1: Foundational UI & State Management**

**Goal:** Create the basic user interface and structure for the feature.

1.  **Create the Route:**
    *   A new page will be created at `src/app/(user)/problem/page.tsx`. This page will host the main component for the feature.

2.  **Build the Chat Component:**
    *   A client component, `src/app/(user)/problem/ProblemSolver.tsx`, will be created.
    *   This component will contain the entire UI: a message display area, a text input field, a "Send" button, and placeholder buttons for "I'm Stuck" and taking photos.

3.  **Implement State Management:**
    *   Within `ProblemSolver.tsx`, we will use React's `useState` hook to manage the conversation flow. This includes:
        *   An array to hold the history of messages (from both the user and the AI).
        *   A state for the current step of the fetched DIY guide.
        *   Loading states to show spinners while the AI is "thinking" or guides are being fetched.
        *   A state to hold the `vendorCategory` tag returned by the initial analysis.

### **Phase 2: Text Analysis & Guide Fetching (The Brain & The Library)**

**Goal:** Integrate the text AI to understand the user's problem and fetch the correct guide.

1.  **Integrate Puter.js:**
    *   The Puter.js script (`<script src="https://js.puter.com/v2/"></script>`) will be added to the root layout file (`src/app/layout.tsx`) to make it available throughout the app.

2.  **Implement Initial Analysis Flow:**
    *   When the user sends their initial problem description (e.g., "my toilet is running"), the `ProblemSolver.tsx` component will:
        a.  Make an in-browser call to `(window as any).puter.ai.chat()`.
        b.  The prompt will ask the AI to return a JSON object containing two keys: `query` (a hyphenated search term for WikiHow) and `category` (the professional vendor category).
        c.  The component will parse this JSON response.

3.  **Create the WikiHow Proxy:**
    *   A new Cloud Function named `getWikiHowGuide` will be created. This function's sole purpose is to securely receive a search query from the app, call the WikiHow API with that query, and return the guide data. This prevents exposing any API details on the client side.

4.  **Fetch and Display the Guide:**
    *   After receiving the `query` from Puter.js, the `ProblemSolver.tsx` component will call the `getWikiHowGuide` Cloud Function.
    *   Upon receiving the guide data, the component will display the first step in the chat UI and enable the "Next Step" and "I'm Stuck" buttons.

### **Phase 3: Visual Analysis (The Eyes)**

**Goal:** Implement the photo analysis feature for when the user is stuck.

1.  **Set Up the Vision Model:**
    *   We will add the `onnxruntime-web` library to the project's dependencies.
    *   A pre-trained, quantized **YOLOv8n.onnx** model file (~5MB) will be placed in the `public/models` directory so it can be fetched by the browser.

2.  **Create a Vision Service:**
    *   A new client-side helper file, `src/lib/vision-analysis.ts`, will be created.
    *   This file will contain a function that:
        a.  Loads the ONNX runtime and the YOLOv8n model.
        b.  Takes an image element or buffer as input.
        c.  Runs the object detection inference.
        d.  Returns a simple array of detected object labels (e.g., `['faucet', 'handle', 'screw']`).

3.  **Integrate into the "I'm Stuck" Flow:**
    *   When the user clicks "I'm Stuck," the app will use the browser's Camera API to let the user take a photo.
    *   The captured photo will be passed to our new vision service.
    *   The resulting array of labels will be stored in the component's state.

### **Phase 4: Connecting Vision to Context (The Translation)**

**Goal:** Use the text AI to translate the generic image labels into a helpful, contextual instruction.

1.  **Implement the Translation Logic:**
    *   After the "Eyes" (YOLOv8n) produce the list of labels, the `ProblemSolver.tsx` component will call **Puter.js (The Brain)** for a second time.
    *   This call will be structured as a "translation" task. The prompt will include:
        *   The text of the current, confusing guide step (e.g., "Step 4: Remove the set screw").
        *   The array of labels from the vision model (e.g., `['handle', 'screw', 'cap']`).
        *   The explicit instruction: "Which object from the list is most likely the 'set screw'? Formulate a simple sentence for the user."
    *   Puter.js will return a single, helpful sentence (e.g., "The 'set screw' is the small 'screw' that was detected on the 'handle'.").
    *   The app will display this sentence to the user.

### **Phase 5: Vendor Recommendation**

**Goal:** Seamlessly recommend the correct professionals when the user needs them.

1.  **Implement the Recommendation Trigger:**
    *   A "Find a Pro" button will be made available to the user at the end of the guide or if they choose to give up.

2.  **Filter and Display Vendors:**
    *   When the button is clicked, the app will use the `vendorCategory` tag that was generated and saved in **Phase 2, Step 2**.
    *   It will then perform a simple, non-AI filter on your existing Firebase vendor database to find all vendors matching that category.
    *   The resulting list of vendors will be displayed to the user within the app.
