# **App Name**: Zipp

## Core Features:

- User Authentication and Management: Secure user sign-up/login using Firebase Authentication; create/manage user profiles with roles (user, vendor, admin); Firestore user document creation on signup; email verification step.
- Vendor Onboarding and Approval Workflow: Vendor registration with 'pending_verification' status; admin approval flow to activate vendors; role-based access control.
- Category and Module Management: Admin UI to create/configure categories, modules (promotions, products, bookings, listings), and field schemas without code changes.
- Search-First User Interface: Centralized search bar on the landing page with geolocation and manual input options; autocomplete suggestions powered by services and Google Places API.
- Promotions & Redemptions: Vendors can create time-based deals. The redemption process will be done with secure QR codes and unique alphanumeric codes.
- External API Orchestration: Orchestrate manual scrapes based on a specified region + keyword for fetching the corresponding promotions from Google Places API, and cache the scrape results.
- Scraping Deduplication: Identify similar business entities by the name, phone and address to avoid duplicating similar vendor entries. The LLM powered tool will evaluate which information has the highest confidence based on previous datasets to include in the vendor update, discarding the unlikeliest candidates.

## Style Guidelines:

- Primary color: Vibrant blue (#29ABE2) to convey trust and reliability, suitable for a service marketplace.
- Background color: Light blue (#E5F5FA), providing a clean and airy feel.
- Accent color: A contrasting yellow (#FFDA63) to highlight key actions and information, ensuring they stand out.
- Body and headline font: 'Inter' sans-serif for a clean, modern and professional look, ensuring legibility and a tech-forward appearance.
- Use clear, geometric icons, with an accent of the chosen vibrant blue. All icons should be uniform in style to ensure consistency and visual clarity across the app.
- Employ a mobile-first, responsive design, prioritizing clean layouts and intuitive navigation to minimize friction and enhance usability.
- Implement subtle transitions and loading animations to provide feedback and enhance the user experience, avoiding distractions and maintaining a polished feel.