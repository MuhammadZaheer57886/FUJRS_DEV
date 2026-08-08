// Sample data for the role dashboards. This build has no backend, so these
// fixtures are what every dashboard renders.
import type { CommissionRate } from "@/lib/commission";
import { referralCodeFor } from "@/lib/referral";
import type { PayoutStatus } from "@/lib/payouts";
import type { MeasurementSet } from "@/lib/measurements";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";

const DEMO_REVENUE_DAYS = 14;
const DEMO_DAILY_REVENUE_BASE = 45_000;
const DEMO_DAILY_REVENUE_VARIANCE = 30_000;

function buildDemoRevenueSeries() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: DEMO_REVENUE_DAYS }, (_, i) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - (DEMO_REVENUE_DAYS - 1 - i));
    const wave = Math.sin(i / 2) * DEMO_DAILY_REVENUE_VARIANCE;
    const revenue = Math.max(0, Math.round(DEMO_DAILY_REVENUE_BASE + wave));
    return { date: day.toISOString().slice(0, 10), revenue };
  });
}

export const DEMO_STATS = {
  totalOrders: 128,
  totalRevenue: 5_460_000,
  revenueByDay: buildDemoRevenueSeries(),
  ordersByStatus: [
    { status: "CONFIRMED", count: 96 },
    { status: "PROCESSING", count: 21 },
    { status: "DELIVERED", count: 11 },
  ],
  recentOrders: [
    {
      id: "demo-order-4f2a9c31",
      customer: "Ayesha Raza",
      total: 42500,
      status: "CONFIRMED",
      itemCount: 2,
    },
    {
      id: "demo-order-88b1d740",
      customer: "Bilal Ahmed",
      total: 18900,
      status: "PROCESSING",
      itemCount: 1,
    },
    {
      id: "demo-order-1c7e5b92",
      customer: "Sana Tariq",
      total: 76200,
      status: "DELIVERED",
      itemCount: 3,
    },
    {
      id: "demo-order-a30f6d15",
      customer: "Usman Ali",
      total: 31000,
      status: "CONFIRMED",
      itemCount: 1,
    },
    {
      id: "demo-order-6e94b0c8",
      customer: "Zara Khan",
      total: 54800,
      status: "CONFIRMED",
      itemCount: 2,
    },
  ],
};

/** A vendor's affiliate account, as the Super Admin sees it. */
export interface DemoVendor {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  commission: CommissionRate;
  clicks: number;
  sales: number;
  /** Commission earned to date, in PKR. */
  earned: number;
  pendingPayout: number;
}

export const DEMO_VENDORS: DemoVendor[] = [
  {
    id: "demo-vendor",
    name: "Demo Vendor",
    email: "vendor@gmail.com",
    referralCode: referralCodeFor("vendor@gmail.com"),
    commission: { type: "PERCENT", value: 12 },
    clicks: 1_284,
    sales: 37,
    earned: 186_400,
    pendingPayout: 42_300,
  },
  {
    id: "demo-vendor-2",
    name: "Hina Malik",
    email: "hina.malik@example.com",
    referralCode: referralCodeFor("hina.malik@example.com"),
    commission: { type: "PERCENT", value: 8 },
    clicks: 642,
    sales: 14,
    earned: 61_200,
    pendingPayout: 0,
  },
  {
    id: "demo-vendor-3",
    name: "Faisal Sheikh",
    email: "faisal.sheikh@example.com",
    referralCode: referralCodeFor("faisal.sheikh@example.com"),
    commission: { type: "FLAT", value: 2_500 },
    clicks: 310,
    sales: 9,
    earned: 22_500,
    pendingPayout: 7_500,
  },
];

/** Sales credited to a vendor's referral links. Commission is derived at render. */
export interface DemoReferredSale {
  id: string;
  orderId: string;
  product: string;
  salePrice: number;
  date: string;
}

export const DEMO_REFERRED_SALES: DemoReferredSale[] = [
  {
    id: "demo-ref-1",
    orderId: "demo-order-4f2a9c31",
    product: "Emerald Silk Unstitched Set",
    salePrice: 45_000,
    date: "2026-07-28",
  },
  {
    id: "demo-ref-2",
    orderId: "demo-order-88b1d740",
    product: "Midnight Zardozi Velvet",
    salePrice: 62_500,
    date: "2026-07-24",
  },
  {
    id: "demo-ref-3",
    orderId: "demo-order-1c7e5b92",
    product: "Blush Pearl Organza",
    salePrice: 38_000,
    date: "2026-07-19",
  },
  {
    id: "demo-ref-4",
    orderId: "demo-order-a30f6d15",
    product: "Ivory Karandi Suiting",
    salePrice: 12_900,
    date: "2026-07-11",
  },
];

export interface DemoPayout {
  id: string;
  date: string;
  amount: number;
  status: PayoutStatus;
}

export const DEMO_PAYOUTS: DemoPayout[] = [
  { id: "demo-payout-1", date: "2026-07-01", amount: 58_900, status: "Paid" },
  { id: "demo-payout-2", date: "2026-06-01", amount: 44_200, status: "Paid" },
  { id: "demo-payout-3", date: "2026-08-01", amount: 42_300, status: "Processing" },
];

export interface DemoQueueItem {
  id: string;
  orderId: string;
  customer: string;
  garment: string;
  stitchingLabel: string;
  status: string;
  createdAt: string;
  /** What the customer entered at `/tailoring/configure`, in inches. */
  measurements: MeasurementSet;
  /** The style choices priced into the order, which change how it's cut. */
  neckline: string;
  sleeve: string;
  hemline: string;
  /** Anything the customer asked for in their own words. */
  notes: string | null;
}

export const DEMO_TAILOR_QUEUE: DemoQueueItem[] = [
  {
    id: "demo-queue-1",
    orderId: "demo-order-4f2a9c31",
    customer: "Ayesha Raza",
    garment: "3-Piece Suit",
    stitchingLabel: "Bespoke Fit",
    status: STITCHING_STATUSES[0],
    createdAt: new Date().toISOString(),
    measurements: {
      Chest: "36",
      Waist: "30",
      Hips: "38",
      Shoulder: "15",
      "Arm Length": "23",
      Length: "42",
      Bicep: "12",
      Neck: "14",
      "Front Length": "23",
      "Back Length": "24",
      "Trouser Length": "38",
      Inseam: "29",
    },
    neckline: "Mandarin",
    sleeve: "Bell Cuff",
    hemline: "Scalloped Edge",
    notes: "Please keep the sleeves a touch loose at the cuff.",
  },
  {
    id: "demo-queue-2",
    orderId: "demo-order-a30f6d15",
    customer: "Usman Ali",
    garment: "Sherwani",
    stitchingLabel: "Custom Measurements",
    status: STITCHING_STATUSES[1],
    createdAt: new Date().toISOString(),
    measurements: {
      Chest: "40",
      Waist: "34",
      Hips: "40",
      Shoulder: "17",
      "Arm Length": "25",
      Length: "46",
      Bicep: "14",
      Neck: "16",
      "Front Length": "26",
      "Back Length": "27",
      "Trouser Length": "40",
      Inseam: "31",
    },
    neckline: "Mandarin",
    sleeve: "Full Length",
    hemline: "Straight Classic",
    notes: null,
  },
];
