
import type { Timestamp, GeoPoint } from "firebase/firestore";

export interface Address {
  line1: string;
  line2?: string;
  postalCode: string;
  country: string;
}

export interface UserCollection {
  promotionId: string;
  vendorId: string;
  collectedAt: Date | Timestamp;
  redemptionId: string; // Unique ID for this specific collection instance
}

export interface ZippUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  phone: string;
  address: Address;
  role: "user" | "vendor" | "admin";
  region?: string; 
  location?: GeoPoint;
  dob?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  profession?: string;
  favourites?: string[]; // Array of vendorId
  collectedPromotions?: UserCollection[];
  redeemedPromotions?: string[]; // Array of unique promotionId
  uncollectedPromotions?: string[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  vendorId?: string; 
}

// This represents the Vendor structure in the denormalized JSON dataset
export interface Vendor {
  id: string; 
  name: string;
  normalizedName: string;
  searchableName: string; 
  searchableNameTokens?: string[];
  categoryId: string;
  logoUrl?: string;
  description?: string;
  region: string;
  lat?: number;
  lng?: number;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: { [key: string]: any } | string[];
  googleRating?: number;
  googleReviewCount?: number;
  zippRating?: number;
  zippReviewCount?: number;
  tags?: string[];
  searchableTags?: string[];
  matchedKeywords?: string[]; // New field for enriched keywords
  modulesEnabled: string[];
  subscriptionStatus: "pending_verification" | "trial" | "free" | "paid" | "pay-as-you-go" | "claimed_pending_approval" | "suspended" | "verified";
  profileViews?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  distance?: number;
  claimedBy?: string;
  trialStartedAt?: Date | Timestamp;
  offerings: Offering[]; // Offerings are nested
  reviews: Review[]; // Reviews are now nested
  promotions: Promotion[];
  // New fields for Google Places integration
  googlePlaceId?: string;
  photos?: (string | GooglePhoto)[];
  priceLevel?: number;
  types?: string[];
  googleLastSyncedAt?: Date | Timestamp;
  dedupeConfidence?: number;
  googleSyncLocked?: boolean;
}

export interface GooglePhoto {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
}

// This represents the Offering structure nested inside a Vendor in the JSON dataset
export interface Offering {
    id: string; 
    vendorId: string;
    name: string;
    searchableName: string; 
    description?: string;
    type: 'product' | 'service';
    isActive: boolean;
    pricingModel?: 'fixed' | 'per_hour' | 'per_unit';
    price: number;
    currency: string;
    inStock?: boolean;
    sku?: string;
    images?: string[];
    customFields?: { [key: string]: any };
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export interface Review {
    id: string;
    vendorId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number; 
    text: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    author_name?: string; // From Google
    time?: number; // From Google
}

export interface Feedback {
    id: string;
    feedbackId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date | Timestamp;
}

export interface Category {
  id: string; 
  categoryId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  modulesAvailable: string[];
  defaultModules: string[];
  fieldsSchema: FieldSchema[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "select";
  required: boolean;
  uiComponent: "text" | "textarea" | "select" | "switch" | "file";
  options?: string[];
  defaultValue?: any;
}

export interface RedemptionEvent {
    redemptionId: string; // Unique ID for this specific event
    userId: string;
    status: 'collected' | 'redeemed';
    collectedAt: Date | Timestamp;
    redeemedAt?: Date | Timestamp;
}

export interface Promotion {
  id: string; 
  promotionId: string;
  vendorId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  startAt: Date | Timestamp;
  endAt: Date | Timestamp;
  terms?: string;
  redemptionType: "qr" | "code" | "in-store";
  quota?: number;
  redemptions?: RedemptionEvent[];
  createdAt: Date | Timestamp;
  createdBy: string;
  updatedAt: Date | Timestamp;
}

export interface Order {
    id: string; 
    userId: string;
    vendorId: string;
    items: { productId: string, name: string, qty: number, price: number, currency: string }[];
    totalAmount: number;
    currency: string;
    status: "pending" | "ready_for_pickup" | "collected" | "cancelled";
    pickupCode: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export interface Booking {
    id: string; 
    userId: string;
    vendorId: string;
    service: { id: string, name: string, price: number, durationMinutes: number };
    dateTime: Date | Timestamp;
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export type ActivityLogConfig = {
  [key in ActivityType]?: boolean;
};

export interface AdminConfig {
    id?: string;
    stripePublicKey: string;
    googlePlacesApiKeyName: string; 
    stripeSecretKeyName: string;
    cacheTTLs: {
        googlePlacesDays: number;
        serperDays: number;
    };
    modulesMasterList: string[];
    regionsMasterList: string[];
    activityLogConfig?: ActivityLogConfig;
    cacheVersion?: number;
}

export interface Landmark {
    name: string;
    lat: number;
    lng: number;
    type: 'landmark';
}

export type ActivityType = 
    | 'login'
    | 'location_search'
    | 'category_browse'
    | 'get_current_location'
    | 'view_vendor'
    | 'redeem_promotion'
    | 'vendor_profile_update'
    | 'offering_create'
    | 'offering_update'
    | 'offering_delete'
    | 'offering_status_toggle'
    | 'promotion_create'
    | 'promotion_update'
    | 'promotion_delete'
    | 'order_status_update'
    | 'booking_status_update';

export const ALL_USER_ACTIVITY_TYPES: ActivityType[] = [
    'login', 'location_search', 'category_browse', 'get_current_location', 'view_vendor', 'redeem_promotion'
];

export const ALL_VENDOR_ACTIVITY_TYPES: ActivityType[] = [
    'vendor_profile_update', 'offering_create', 'offering_update', 'offering_delete', 'offering_status_toggle', 'promotion_create', 'promotion_update', 'promotion_delete', 'order_status_update', 'booking_status_update'
];

export interface VerificationSignal {
    verified: boolean;
    vendorId: string;
}

export interface AnalyticsData {
    id: string; // YYYY-MM for monthly, or 'stats' for global stats
    month?: string;
    reads?: number;
    writes?: number;
    deletes?: number;
    totalUsers?: number;
    totalVendors?: number;
}

export interface ScrapeJobResult {
  success: boolean;
  message: string;
  categoryId: string;
  region: string;
  logs?: string[];
}

export interface ScrapeCache {
  id: string;
  serviceKeyword: string;
  region: string;
  source: string;
  storagePath: string; // Changed from apiResponse to storagePath
  createdAt: Timestamp;
  expiresAt: Timestamp;
  notes?: string;
}
