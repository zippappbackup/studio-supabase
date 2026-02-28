
/**
 * This file contains sample data for populating a development Firestore database.
 * You can manually add this data to your Firestore console to get started.
 */
import type { Category, Vendor, Promotion, Offering, AdminConfig, Review } from './types';

interface SeedData {
  categories: { [id: string]: Omit<Category, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'> };
  vendors: { [id: string]: Omit<Vendor, 'id' |'createdAt' | 'updatedAt'> };
  promotions: { [id: string]: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> };
  offerings: { [vendorId: string]: Omit<Offering, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>[] };
  reviews: { [vendorId: string]: Omit<Review, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>[] };
  adminConfig: { [id: string]: Partial<AdminConfig> };
}

// Data for mock vendor auth user creation
export const mockVendorsAuth = [
    { 
        id: "mock-vendor-chicken-rice", 
        name: "The Chicken Rice Shop",
        email: "the-chicken-rice-shop@example.com", 
        password: "password123" 
    },
    { 
        id: "mock-vendor-sparkle-cleaners", 
        name: "Sparkle Cleaners",
        email: "sparkle-cleaners@example.com", 
        password: "password123" 
    },
];

const generateRealisticVendors = (count: number): { [id: string]: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> } => {
    const vendors: { [id: string]: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> } = {};
    const categories = ["cleaning services", "handyman services", "mobile device repair", "car care"];
    const statuses: Vendor['subscriptionStatus'][] = ["paid", "trial", "free", "pay-as-you-go", "pending_verification"];
    
    const names = {
        "f-and-b": ["The Tasty Pot", "Wok & Roll", "Mama's Kitchen", "The Noodle House", "Crispy Delights", "Burger Hub", "Salad Story", "Pizza Planet", "Kopi Time", "Curry Corner"],
        "groceries": ["Daily Needs Grocer", "Fresh Mart", "Quick Stop", "The Corner Store", "ValueMart", "Green Grocer", "Organic Pantry", "SG Mini-Mart"],
        "cleaning services": ["Swift Clean", "Eco Shine", "Pro Maids", "Pure Space", "Gleam Team", "Spotless Solutions", "City Cleaners", "The Dust Busters"],
        "handyman services": ["Fix-It Felix", "The Helpful Handyman", "Mr. Fix", "Reliable Repairs", "SG Handyman Services"],
        "mobile device repair": ["iFixit", "Gadget Hospital", "Screen Savers", "Mobile Mend", "Phone ER"],
        "car care": ["Auto Gleam", "Sparkle Wash", "The Car Spa", "Pristine Rides", "Mobile Car Cleaners"],
    };

    const singaporeStreets = [
        // Central
        { name: "Orchard Rd", postalPrefix: "23", lat: 1.304, lng: 103.831 },
        { name: "Tiong Bahru Rd", postalPrefix: "16", lat: 1.284, lng: 103.829 },
        { name: "Telok Ayer St", postalPrefix: "06", lat: 1.282, lng: 103.848 },
        { name: "Victoria St", postalPrefix: "18", lat: 1.298, lng: 103.855 },
        { name: "Toa Payoh Lor 8", postalPrefix: "31", lat: 1.332, lng: 103.856 },
        { name: "Novena", postalPrefix: "30", lat: 1.321, lng: 103.844 },
        
        // North
        { name: "Ang Mo Kio Ave 10", postalPrefix: "56", lat: 1.369, lng: 103.854 },
        { name: "Yishun Ring Rd", postalPrefix: "76", lat: 1.429, lng: 103.835 },
        { name: "Woodlands Ave 5", postalPrefix: "73", lat: 1.436, lng: 103.786 },
        { name: "Sembawang Rd", postalPrefix: "75", lat: 1.449, lng: 103.820 },
        
        // East
        { name: "Tampines Ave 4", postalPrefix: "52", lat: 1.353, lng: 103.944 },
        { name: "Bedok North St 3", postalPrefix: "46", lat: 1.331, lng: 103.935 },
        { name: "Pasir Ris Dr 1", postalPrefix: "51", lat: 1.373, lng: 103.948 },
        { name: "Marine Parade Rd", postalPrefix: "44", lat: 1.302, lng: 103.905 },
        { name: "Changi Village Rd", postalPrefix: "50", lat: 1.389, lng: 103.987 },
        { name: "Paya Lebar Rd", postalPrefix: "40", lat: 1.325, lng: 103.893 },

        // West
        { name: "Jurong West St 61", postalPrefix: "64", lat: 1.339, lng: 103.707 },
        { name: "Clementi Ave 3", postalPrefix: "12", lat: 1.315, lng: 103.765 },
        { name: "Bukit Batok St 11", postalPrefix: "65", lat: 1.349, lng: 103.751 },
        { name: "Choa Chu Kang Ave 4", postalPrefix: "68", lat: 1.383, lng: 103.743 },
        { name: "Holland Ave", postalPrefix: "27", lat: 1.311, lng: 103.796 },
        { name: "Commonwealth Ave West", postalPrefix: "13", lat: 1.309, lng: 103.788 },
        
        // North-East
        { name: "Serangoon Ave 2", postalPrefix: "55", lat: 1.352, lng: 103.873 },
        { name: "Hougang Ave 8", postalPrefix: "53", lat: 1.370, lng: 103.890 },
        { name: "Sengkang East Way", postalPrefix: "54", lat: 1.391, lng: 103.895 },
        { name: "Punggol Field", postalPrefix: "82", lat: 1.405, lng: 103.902 },
    ];

    for (let i = 0; i < count; i++) {
        const vendorId = `mock-vendor-${i + 1}`;
        const categoryId = categories[i % categories.length];
        const nameList = names[categoryId as keyof typeof names] || names['cleaning services'];
        const name = `${nameList[i % nameList.length]} #${Math.floor(i / nameList.length) + 1}`;
        
        const streetInfo = singaporeStreets[i % singaporeStreets.length];
        const block = Math.floor(Math.random() * 800) + 100;
        const postalCode = streetInfo.postalPrefix + (Math.floor(Math.random() * 9000) + 1000).toString();
        const address = `Blk ${block}, ${streetInfo.name}, Singapore ${postalCode}`;

        // Generate lat/lng around the street's center
        const lat = streetInfo.lat + (Math.random() - 0.5) * 0.008; // Smaller radius for more density
        const lng = streetInfo.lng + (Math.random() - 0.5) * 0.008;
        
        const zippReviewCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 reviews
        const zippRating = parseFloat((Math.random() * 1.8 + 3.2).toFixed(1)); // Rating between 3.2 and 5.0
        
        const status = statuses[i % statuses.length];

        const vendorData: Partial<Vendor> = {
            name: name,
            categoryId: categoryId,
            logoUrl: `https://placehold.co/128x128/e5f4fa/289ce2?text=${name.charAt(0)}`,
            description: `Your go-to for ${categoryId}. We provide the best quality and service in town. Come visit us at our Singapore location.`,
            region: "SG",
            address: address,
            city: "Singapore",
            state: "Singapore",
            country: "Singapore",
            lat: lat,
            lng: lng,
            phone: `+65 8${Math.floor(1000000 + Math.random() * 9000000)}`,
            email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.sg`,
            website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.sg`,
            operatingHours: {
                monday: "10:00 AM - 09:00 PM",
                tuesday: "10:00 AM - 09:00 PM",
                wednesday: "10:00 AM - 09:00 PM",
                thursday: "10:00 AM - 09:00 PM",
                friday: "10:00 AM - 10:00 PM",
                saturday: "10:00 AM - 10:00 PM",
                sunday: "Closed",
            },
            googleRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
            googleReviewCount: Math.floor(Math.random() * 500) + 20,
            zippRating: zippRating,
            zippReviewCount: zippReviewCount,
            tags: [categoryId, streetInfo.name.split(' ')[0], "mock-data"],
            modulesEnabled: ["reviews", "offerings", "promotions"],
            subscriptionStatus: status,
        };

        if (status !== 'pending_verification') {
          (vendorData as any).claimedBy = `mock-user-${i}`;
        }
        if (status === 'trial') {
            vendorData.trialStartedAt = new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 10)));
        }

        vendors[vendorId] = vendorData as Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>;
    }
    return vendors;
};

const generatedVendors = generateRealisticVendors(300); 

const generateOfferings = (vendors: { [id: string]: any }): { [vendorId: string]: Omit<Offering, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>[] } => {
    const offerings: { [vendorId: string]: any[] } = {};
    
    const cleaningServices = [
        { name: "Standard Home Cleaning", price: 30.00, type: 'service', model: 'per_hour' },
        { name: "Deep Cleaning (3-room HDB)", price: 250.00, type: 'service', model: 'fixed' },
        { name: "Aircon Servicing", price: 45.00, type: 'service', model: 'per_unit' }
    ];
    const handymanServices = [
        { name: "Leaky Faucet Repair", price: 80.00, type: 'service', model: 'fixed' },
        { name: "Light Fixture Installation", price: 60.00, type: 'service', model: 'fixed' },
        { name: "Drilling and Mounting (per item)", price: 20.00, type: 'service', model: 'per_unit' }
    ];
    const mobileRepairServices = [
        { name: "Screen Replacement (iPhone)", price: 120.00, type: 'service', model: 'fixed' },
        { name: "Battery Replacement", price: 70.00, type: 'service', model: 'fixed' },
        { name: "Diagnostic Check", price: 25.00, type: 'service', model: 'fixed' }
    ];
    const carCleaningServices = [
        { name: "Basic Car Wash & Vacuum", price: 25.00, type: 'service', model: 'fixed' },
        { name: "Full Interior Detailing", price: 150.00, type: 'service', model: 'fixed' },
        { name: "Headlight Restoration", price: 60.00, type: 'service', model: 'fixed' }
    ];


    for (const vendorId in vendors) {
        const vendor = vendors[vendorId];
        offerings[vendorId] = [];
        let items: any[] = [];
        switch (vendor.categoryId) {
            case "cleaning services":
                items = cleaningServices;
                break;
            case "handyman services":
                items = handymanServices;
                break;
            case "mobile device repair":
                items = mobileRepairServices;
                break;
            case "car care":
                items = carCleaningServices;
                break;
        }

        items.forEach(item => {
            const isService = item.type === 'service';
            offerings[vendorId].push({
                name: item.name,
                description: item.description || `A high-quality service by ${vendor.name}.`,
                type: 'service',
                isActive: true,
                price: item.price + (Math.random() - 0.5) * 2,
                currency: "SGD",
                inStock: null,
                sku: null,
                images: null,
                pricingModel: item.model || 'fixed',
            });
        });
    }
    return offerings;
}

const generatePromotions = (vendors: { [id: string]: any }): { [id: string]: any } => {
    const promotions: { [id: string]: any } = {};
    const vendorIds = Object.keys(vendors);
    const promoTitles = [
        "First Time Customer: 10% Off",
        "Weekend Deal: Book 2 get 1 free",
        "Flash Sale: 20% off all services",
        "Special Discount: $10 Off any repair",
        "Membership Special"
    ];

    for (let i = 0; i < 20; i++) {
        const promoId = `promo-mock-${i + 1}`;
        const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)];
        const title = promoTitles[i % promoTitles.length];
        promotions[promoId] = {
            vendorId: vendorId,
            title: `${title}`,
            description: `Enjoy a special discount at ${vendors[vendorId].name}. T&Cs apply.`,
            imageUrl: `https://placehold.co/600x400/e9f4fb/2baade?text=Deal`,
            startAt: new Date(),
            endAt: new Date(new Date().setDate(new Date().getDate() + (Math.floor(Math.random() * 30) + 7))), // 7 to 37 days from now
            terms: "Valid for new customers only. Not applicable with other discounts.",
            redemptionType: ["in-store", "code", "qr"][i % 3],
        };
    }
    return promotions;
}

const generateReviews = (vendors: { [id: string]: any }): { [vendorId: string]: Omit<Review, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>[] } => {
    const reviews: { [vendorId: string]: any[] } = {};
    const userNames = ["Alex", "Brenda", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"];
    const reviewTemplates = [
        { rating: 5, text: "Absolutely fantastic! The quality was top-notch and the service was impeccable. Highly recommended." },
        { rating: 5, text: "A wonderful experience from start to finish. I'll definitely be coming back here again. Loved it!" },
        { rating: 4, text: "Really good stuff. The staff were friendly and everything was as described. Just a little pricey." },
        { rating: 4, text: "Great value for money. Solid quality and quick service. A reliable choice in the neighborhood." },
        { rating: 3, text: "It was okay. Nothing special, but it gets the job done. Might try again if I'm in the area." },
        { rating: 3, text: "An average experience. The service was a bit slow, but the product itself was acceptable." },
        { rating: 2, text: "A bit disappointing, to be honest. The quality didn't match the price. I expected more." },
        { rating: 1, text: "I would not recommend this place. The service was poor and the experience was not pleasant at all." },
    ];
    
    const vendorIds = Object.keys(vendors);

    for (const vendorId of vendorIds) {
        reviews[vendorId] = [];
        const reviewCount = Math.floor(Math.random() * 6) + 3; // 3 to 8 reviews

        for (let i = 0; i < reviewCount; i++) {
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            const userName = userNames[Math.floor(Math.random() * userNames.length)];
            reviews[vendorId].push({
                userId: `mock-user-${i}`,
                userName: userName,
                userAvatar: `https://i.pravatar.cc/150?u=${userName}`,
                rating: template.rating,
                text: template.text.replace('The quality', `The quality at ${vendors[vendorId].name} was`)
            });
        }
    }
    return reviews;
};

export const seedData: SeedData = {
  categories: {
    "cleaning services": {
      name: "Cleaning Services",
      description: "Home and office cleaning services.",
      iconUrl: "",
      modulesAvailable: ["bookings", "reviews", "offerings", "promotions"],
      defaultModules: ["bookings", "reviews", "offerings"],
      fieldsSchema: [
        { key: "insuranceCoverage", label: "Insurance Coverage (SGD)", type: "number", required: true, uiComponent: "text" }
      ]
    },
    "handyman services": {
        name: "Handyman Services",
        description: "General home repair and maintenance services.",
        iconUrl: "",
        modulesAvailable: ["bookings", "reviews", "offerings", "promotions"],
        defaultModules: ["bookings", "reviews", "offerings"],
        fieldsSchema: [
            { key: "licenseNumber", label: "License Number (if any)", type: "string", required: false, uiComponent: "text" },
            { key: "specialties", label: "Specialties (e.g. Plumbing, Electrical)", type: "string", required: false, uiComponent: "textarea" }
        ]
    },
    "mobile device repair": {
        name: "Mobile Device Repair",
        description: "Repair services for mobile phones and tablets.",
        iconUrl: "",
        modulesAvailable: ["bookings", "reviews", "offerings", "promotions"],
        defaultModules: ["bookings", "reviews", "offerings"],
        fieldsSchema: [
            { key: "brandsServiced", label: "Brands Serviced (e.g. Apple, Samsung)", type: "string", required: true, uiComponent: "text" },
            { key: "warrantyOffered", label: "Offers Repair Warranty", type: "boolean", required: false, uiComponent: "switch" }
        ]
    },
    "car care": {
        name: "Car Care",
        description: "Interior and exterior car cleaning, polishing, and detailing.",
        iconUrl: "",
        modulesAvailable: ["bookings", "reviews", "offerings", "promotions"],
        defaultModules: ["bookings", "reviews", "offerings"],
        fieldsSchema: [
            { key: "mobileService", label: "Offers Mobile / At-Home Service", type: "boolean", required: false, uiComponent: "switch" },
            { key: "serviceTypes", label: "Service Types (e.g. Wash, Polish, Detailing)", type: "string", required: false, uiComponent: "textarea" }
        ]
    }
  },

  vendors: generatedVendors,
  
  promotions: generatePromotions(generatedVendors),

  offerings: generateOfferings(generatedVendors),

  reviews: generateReviews(generatedVendors),

  adminConfig: {
      "global": {
          stripePublicKey: "pk_test_...",
          cacheTTLs: { googlePlacesDays: 30, serperDays: 14 },
          modulesMasterList: ["promotions", "offerings", "bookings", "listings", "reviews", "orders"],
          regionsMasterList: ["Singapore", "Malaysia", "Thailand"]
      }
  }
};
