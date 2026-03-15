### Zipp Super App Feature Summary

The application is a comprehensive "Super App" called **Zipp**, designed to connect users with local service vendors in Singapore. It features distinct experiences for three types of users: regular **Users**, **Vendors** (business owners), and **Admins**.

---

#### **For Regular Users (The Customer App)**

This is the primary user-facing Progressive Web App (PWA).

*   **Authentication**: Users can sign up for a personal account or log in.
*   **Home Page**:
    *   A prominent search bar for finding services.
    *   A "Discover Categories" section for browsing major service types like Car Care, Cleaning, and Handyman Services.
    *   **Zipp Highlights**: A curated, auto-refreshing list of top-rated vendors (4.5 stars or higher) to showcase high-quality businesses.
*   **Advanced Search & Discovery**:
    *   Users can search for vendors by keyword, category, or a specific location.
    *   **Advanced Filters**: Search results can be refined by filtering for vendors with active promotions or those with top ratings (4+ stars).
    *   **"Nearby" Functionality**: Users can instantly find services around their current physical location.
    *   **Map View**: Search results can be visualized on an interactive map, showing vendor locations.
*   **Vendor Profiles**:
    *   A detailed view of each business, including their logo, photo gallery, description, contact information, address, and operating hours.
    *   **Offerings/Menu**: A list of specific products or services offered by the vendor, with pricing.
    *   **Promotions**: A dedicated tab to view active deals and promotions offered by the business.
*   **User Interaction**:
    *   **Zipp Reviews**: Users can read and write their own reviews directly on the platform, complete with a star rating and text. They can also edit or delete their own reviews.
    *   **Favourites (Zipp Hub)**: Users can "favorite" a vendor to save them to their personal "Zipp Hub" for easy access later.
    *   **Promotion Collection**: Users can "collect" promotions, which are then saved to their Zipp Hub for redemption.
*   **"I Have a Problem" AI Feature (Planned)**: A sophisticated in-app assistant where users can describe a problem (e.g., "leaking faucet") and receive an AI-driven diagnosis, step-by-step solutions, and recommendations for qualified local vendors who can fix the issue.

---

#### **For Vendors (The Business Owner Portal)**

A dedicated dashboard for business owners to manage their public presence on the Zipp platform.

*   **Claim Your Business**: A flow for business owners to find their existing, unclaimed business profile on Zipp and claim ownership by creating a vendor account.
*   **Vendor Dashboard**: An overview of key business metrics, including profile views, Zipp ratings, and performance of their promotions (collections vs. redemptions).
*   **Profile Management**: A comprehensive form to edit all public-facing business details, including name, description, contact info, address, operating hours, logo, and photo gallery.
*   **Catalogue Management**: The ability to create, edit, and delete items from their list of "Offerings" (products or services), including name, description, price, and type.
*   **Promotion Management**: A tool to create, edit, and manage promotional campaigns to attract customers.

---

#### **For Admins (The Back-Office Management Panel)**

A powerful administrative backend for managing the entire Zipp ecosystem.

*   **Admin Dashboard**: A high-level view of key system metrics, including total vendors, total users, pending business claims, and active promotions across the platform.
*   **Data Management**:
    *   A master table to view, search, and edit every vendor in the live database.
    *   **Bulk Data Import/Export**: Tools to upload new vendor data from a JSON file and export the entire live vendor database as a backup.
    *   **System Actions**: The ability to manually trigger critical background jobs, such as generating the app's search/browse data snapshot.
*   **Vendor Claim Approvals**: A dedicated queue to review and approve or reject claims made by business owners on profiles, acting as a gatekeeper for the platform.
*   **Category Management**: Full control to create, edit, and delete the service categories that structure the entire app (e.g., Handyman Services). This includes defining which modules (like Bookings or Promotions) are available to vendors in that category.
*   **Global Settings**: A configuration panel to manage system-wide settings, including API keys stored in Google Secret Manager, cache durations, and fine-grained control over which user activities get logged for analytics.
*   **Photo Migration Tool**: A utility to fix broken image links by migrating photos from temporary Google Places URLs to permanent Firebase Storage, ensuring images don't disappear.# Cloudflare deployment
