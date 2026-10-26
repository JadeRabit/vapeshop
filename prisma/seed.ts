import "dotenv/config";
import { PrismaClient, type OrderStatus, type PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categoryDefinitions, siteConfig } from "../lib/config";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const DEMO_PASSWORD = "DemoCustomer123";

type DemoVariant = {
  sku: string;
  label: string;
  flavorProfile?: "FRUITY" | "MENTHOL" | "DESSERT" | "TOBACCO" | "OTHER";
  nicotineMg?: number;
  color?: string;
  priceCentavos: number;
  stock: number;
  lowStockThreshold?: number;
};

type DemoProduct = {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  isFeatured: boolean;
  image: string;
  variants: DemoVariant[];
};

const demoProducts: DemoProduct[] = [
  {
    slug: "mango-ice-nic-salt",
    name: "Mango Ice",
    brand: "Tropical Lab",
    categorySlug: "nic-salts",
    shortDescription: "Ripe mango with a cold exhale and a smooth salt-nic finish.",
    description:
      "A house favourite built for pod systems. Sweet, sun-ripened mango is lifted with a crisp menthol finish, delivering a smooth throat hit without harshness. Formulated for low-wattage pods.",
    isFeatured: true,
    image: "/products/nic-salts.svg",
    variants: [
      {
        sku: "TL-MANGO-30",
        label: "30mg · 30ml",
        flavorProfile: "FRUITY",
        nicotineMg: 30,
        priceCentavos: 35000,
        stock: 24,
      },
      {
        sku: "TL-MANGO-50",
        label: "50mg · 30ml",
        flavorProfile: "FRUITY",
        nicotineMg: 50,
        priceCentavos: 35000,
        stock: 18,
      },
    ],
  },
  {
    slug: "blue-razz-freebase",
    name: "Blue Razz",
    brand: "Static Cloud",
    categorySlug: "freebase",
    shortDescription: "Tangy blue raspberry candy with a clean, cloudy finish.",
    description:
      "A bright blue raspberry profile layered over a soft candy base. Balanced for sub-ohm tanks and rebuildables, with a clean finish that keeps the flavour from turning heavy.",
    isFeatured: true,
    image: "/products/freebase.svg",
    variants: [
      {
        sku: "SC-BLURAZZ-3",
        label: "3mg · 60ml",
        flavorProfile: "FRUITY",
        nicotineMg: 3,
        priceCentavos: 55000,
        stock: 12,
      },
      {
        sku: "SC-BLURAZZ-6",
        label: "6mg · 60ml",
        flavorProfile: "FRUITY",
        nicotineMg: 6,
        priceCentavos: 55000,
        stock: 8,
      },
    ],
  },
  {
    slug: "aurora-pod-kit",
    name: "Aurora Pod Kit",
    brand: "Northstar",
    categorySlug: "pod-systems",
    shortDescription: "A 900mAh refillable pod with draw activation and USB-C charging.",
    description:
      "Pocketable, quiet, and simple. The Aurora pairs a 900mAh battery with a 2ml refillable pod and a tight, cigarette-like draw. Draw-activated firing, USB-C fast charge, and a visible battery indicator.",
    isFeatured: true,
    image: "/products/pod-systems.svg",
    variants: [
      {
        sku: "NS-AURORA-BLK",
        label: "Midnight Black",
        color: "Black",
        priceCentavos: 145000,
        stock: 7,
      },
      {
        sku: "NS-AURORA-SLV",
        label: "Frost Silver",
        color: "Silver",
        priceCentavos: 145000,
        stock: 0,
      },
    ],
  },
  {
    slug: "neon-blast-disposable",
    name: "Neon Blast 5K",
    brand: "Pulse",
    categorySlug: "disposables",
    shortDescription: "5,000 puffs of lychee-menthol brightness in a rechargeable body.",
    description:
      "A rechargeable disposable with a 650mAh battery, mesh coil, and 5,000-puff rating. Lychee sweetness meets a cool menthol edge. Sealed pod system, no refilling or coil changes.",
    isFeatured: true,
    image: "/products/disposables.svg",
    variants: [
      {
        sku: "PL-NEON-LYCHEE",
        label: "Lychee Menthol · 5K",
        flavorProfile: "MENTHOL",
        priceCentavos: 65000,
        stock: 30,
      },
      {
        sku: "PL-NEON-GRAPE",
        label: "Grape Ice · 5K",
        flavorProfile: "FRUITY",
        priceCentavos: 65000,
        stock: 5,
      },
    ],
  },
  {
    slug: "titan-100w-mod",
    name: "Titan 100W",
    brand: "Forge",
    categorySlug: "mods-tanks",
    shortDescription: "Single-21700 box mod with a machined body and 100W output.",
    description:
      "A compact single-battery mod built from aircraft-grade aluminium. Variable wattage up to 100W, temperature control, and a crisp OLED display. Battery sold separately.",
    isFeatured: false,
    image: "/products/mods-tanks.svg",
    variants: [
      {
        sku: "FG-TITAN-GRY",
        label: "Gunmetal",
        color: "Gunmetal",
        priceCentavos: 295000,
        stock: 3,
        lowStockThreshold: 4,
      },
    ],
  },
  {
    slug: "cloud-chaser-subtank",
    name: "Cloud Chaser Tank",
    brand: "Forge",
    categorySlug: "mods-tanks",
    shortDescription: "5ml sub-ohm tank with adjustable airflow and mesh coils.",
    description:
      "A 5ml sub-ohm tank with a wide-bore drip tip, dual adjustable airflow, and a leak-resistant fill port. Compatible with the Forge mesh coil family for dense flavour at 0.15–0.3 ohm.",
    isFeatured: false,
    image: "/products/mods-tanks.svg",
    variants: [
      {
        sku: "FG-CCTANK-SS",
        label: "Stainless · 5ml",
        priceCentavos: 125000,
        stock: 10,
      },
    ],
  },
  {
    slug: "mesh-coil-5pack",
    name: "Mesh Coil 5-Pack",
    brand: "Forge",
    categorySlug: "coils-accessories",
    shortDescription: "Replacement mesh coils for the Cloud Chaser tank family.",
    description:
      "Five replacement mesh coils with fast ramp-up and even heat distribution. Available in 0.15 ohm and 0.3 ohm options. Prime before first use for best flavour.",
    isFeatured: false,
    image: "/products/coils-accessories.svg",
    variants: [
      {
        sku: "FG-MESH-015",
        label: "0.15 ohm · 5-pack",
        priceCentavos: 55000,
        stock: 40,
      },
      {
        sku: "FG-MESH-030",
        label: "0.3 ohm · 5-pack",
        priceCentavos: 55000,
        stock: 35,
      },
    ],
  },
  {
    slug: "lychee-chill-nic-salt",
    name: "Lychee Chill",
    brand: "Tropical Lab",
    categorySlug: "nic-salts",
    shortDescription: "Fragrant lychee with a soft, cooling finish for pods.",
    description:
      "Juicy lychee and a measured dose of menthol, blended for refillable pods. Bright on the inhale, clean on the exhale, and gentle on coils.",
    isFeatured: false,
    image: "/products/nic-salts.svg",
    variants: [
      {
        sku: "TL-LYCHEE-30",
        label: "30mg · 30ml",
        flavorProfile: "MENTHOL",
        nicotineMg: 30,
        priceCentavos: 36000,
        stock: 0,
      },
      {
        sku: "TL-LYCHEE-50",
        label: "50mg · 30ml",
        flavorProfile: "MENTHOL",
        nicotineMg: 50,
        priceCentavos: 36000,
        stock: 5,
      },
    ],
  },
];

type DemoOrderLine = { sku: string; quantity: number };

type DemoOrder = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  paymentReference?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  lines: DemoOrderLine[];
  events: Array<{
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string;
  }>;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set before seeding.`);
  return value;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seedCategories() {
  for (const [index, category] of categoryDefinitions.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: index,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: index,
        isActive: true,
      },
    });
  }
}

async function seedAdmin() {
  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  if (password.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "VapeShop Admin",
      role: "ADMIN",
      passwordHash,
    },
    create: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "VapeShop Admin",
      email,
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin ready: ${admin.email}`);
  return admin;
}

async function seedDemoData(adminId: string) {
  const categoryRows = await prisma.category.findMany();
  const categoryBySlug = new Map(categoryRows.map((category) => [category.slug, category]));

  for (const product of demoProducts) {
    const category = categoryBySlug.get(product.categorySlug);
    if (!category) throw new Error(`Missing category ${product.categorySlug}`);

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        categoryId: category.id,
        shortDescription: product.shortDescription,
        description: product.description,
        isFeatured: product.isFeatured,
        isActive: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        categoryId: category.id,
        shortDescription: product.shortDescription,
        description: product.description,
        isFeatured: product.isFeatured,
        isActive: true,
      },
    });

    const media = await prisma.mediaAsset.upsert({
      where: { publicId: `demo/products/${product.slug}` },
      update: {
        secureUrl: product.image,
        ownerId: adminId,
        kind: "PRODUCT_IMAGE",
        width: 800,
        height: 800,
        mimeType: "image/svg+xml",
      },
      create: {
        publicId: `demo/products/${product.slug}`,
        secureUrl: product.image,
        ownerId: adminId,
        kind: "PRODUCT_IMAGE",
        width: 800,
        height: 800,
        mimeType: "image/svg+xml",
      },
    });

    const variants = [];
    for (const [index, variant] of product.variants.entries()) {
      variants.push(
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          update: {
            productId: savedProduct.id,
            label: variant.label,
            flavorProfile: variant.flavorProfile ?? null,
            nicotineMg: variant.nicotineMg ?? null,
            color: variant.color ?? null,
            priceCentavos: variant.priceCentavos,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
            isActive: true,
            sortOrder: index,
          },
          create: {
            productId: savedProduct.id,
            sku: variant.sku,
            label: variant.label,
            flavorProfile: variant.flavorProfile ?? null,
            nicotineMg: variant.nicotineMg ?? null,
            color: variant.color ?? null,
            priceCentavos: variant.priceCentavos,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
            isActive: true,
            sortOrder: index,
          },
        }),
      );
    }

    await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
    await prisma.productImage.create({
      data: {
        productId: savedProduct.id,
        mediaId: media.id,
        alt: `${product.name} by ${product.brand} packaging`,
        sortOrder: 0,
      },
    });
  }

  const customer = await prisma.user.upsert({
    where: { email: "demo.customer@vapordistrict.ph" },
    update: { name: "Mika Santos", role: "CUSTOMER" },
    create: {
      name: "Mika Santos",
      email: "demo.customer@vapordistrict.ph",
      role: "CUSTOMER",
      phone: "09171234567",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    },
  });

  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: "Home",
        recipientName: "Mika Santos",
        phone: "09171234567",
        line1: "42 Mabini Street",
        barangay: "Poblacion",
        city: "Makati City",
        province: "Metro Manila",
        postalCode: "1210",
        isDefault: true,
      },
    });
  }

  const variants = await prisma.productVariant.findMany({
    include: { product: true },
  });
  const variantBySku = new Map(variants.map((variant) => [variant.sku, variant]));

  const shippingAddress = {
    recipientName: "Mika Santos",
    phone: "09171234567",
    line1: "42 Mabini Street",
    barangay: "Poblacion",
    city: "Makati City",
    province: "Metro Manila",
    postalCode: "1210",
    country: "PH",
  };

  const demoOrders: DemoOrder[] = [
    {
      orderNumber: "VD-1001",
      status: "PENDING" as const,
      paymentMethod: "COD" as const,
      createdAt: daysAgo(2),
      lines: [
        { sku: "TL-MANGO-30", quantity: 2 },
        { sku: "FG-MESH-015", quantity: 1 },
      ],
      events: [{ fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." }],
    },
    {
      orderNumber: "VD-1002",
      status: "SHIPPED" as const,
      paymentMethod: "COD" as const,
      createdAt: daysAgo(8),
      shippedAt: daysAgo(6),
      lines: [{ sku: "PL-NEON-LYCHEE", quantity: 2 }],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "SHIPPED" as const, note: "Handed to courier." },
      ],
    },
    {
      orderNumber: "VD-1003",
      status: "PAID" as const,
      paymentMethod: "GCASH" as const,
      createdAt: daysAgo(15),
      paidAt: daysAgo(14),
      paymentReference: "GC-DEMO-1003",
      lines: [
        { sku: "TL-MANGO-50", quantity: 1 },
        { sku: "SC-BLURAZZ-6", quantity: 1 },
      ],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "PAID" as const, note: "GCash receipt verified." },
      ],
    },
    {
      orderNumber: "VD-1004",
      status: "PENDING" as const,
      paymentMethod: "GCASH" as const,
      createdAt: daysAgo(1),
      paymentReference: "GC-DEMO-1004",
      lines: [{ sku: "NS-AURORA-BLK", quantity: 1 }],
      events: [{ fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." }],
    },
    {
      orderNumber: "VD-1005",
      status: "DELIVERED" as const,
      paymentMethod: "COD" as const,
      createdAt: daysAgo(25),
      paidAt: daysAgo(22),
      shippedAt: daysAgo(23),
      deliveredAt: daysAgo(22),
      lines: [
        { sku: "FG-TITAN-GRY", quantity: 1 },
        { sku: "FG-MESH-030", quantity: 2 },
      ],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "SHIPPED" as const, note: "Handed to courier." },
        { fromStatus: "SHIPPED" as const, toStatus: "DELIVERED" as const, note: "Cash collected." },
      ],
    },
    {
      orderNumber: "VD-1006",
      status: "PAID" as const,
      paymentMethod: "CARD" as const,
      createdAt: daysAgo(5),
      paidAt: daysAgo(5),
      stripeCheckoutSessionId: "cs_test_demo_1006",
      stripePaymentIntentId: "pi_test_demo_1006",
      lines: [{ sku: "PL-NEON-GRAPE", quantity: 1 }],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "PAID" as const, note: "Card payment confirmed." },
      ],
    },
    {
      orderNumber: "VD-1007",
      status: "CANCELLED" as const,
      paymentMethod: "COD" as const,
      createdAt: daysAgo(20),
      cancelledAt: daysAgo(19),
      lines: [{ sku: "FG-CCTANK-SS", quantity: 1 }],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "CANCELLED" as const, note: "Cancelled by staff." },
      ],
    },
    {
      orderNumber: "VD-1008",
      status: "CANCELLED" as const,
      paymentMethod: "CARD" as const,
      createdAt: daysAgo(3),
      cancelledAt: daysAgo(3),
      stripeCheckoutSessionId: "cs_test_demo_1008",
      lines: [{ sku: "TL-LYCHEE-50", quantity: 1 }],
      events: [
        { fromStatus: null, toStatus: "PENDING" as const, note: "Order placed." },
        { fromStatus: "PENDING" as const, toStatus: "CANCELLED" as const, note: "Card session expired." },
      ],
    },
  ];

  for (const demoOrder of demoOrders) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: demoOrder.orderNumber },
    });
    if (existing) continue;

    const lines = demoOrder.lines.map((line) => {
      const variant = variantBySku.get(line.sku);
      if (!variant) throw new Error(`Missing demo variant ${line.sku}`);
      return {
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: variant.label,
        sku: variant.sku,
        unitPriceCentavos: variant.priceCentavos,
        quantity: line.quantity,
        lineTotalCentavos: variant.priceCentavos * line.quantity,
      };
    });

    const subtotalCentavos = lines.reduce((sum, line) => sum + line.lineTotalCentavos, 0);
    const shippingCentavos =
      subtotalCentavos >= siteConfig.freeShippingThresholdCentavos
        ? 0
        : siteConfig.shippingFlatCentavos;

    let paymentProofId: string | undefined;
    if (demoOrder.paymentMethod === "GCASH") {
      const proof = await prisma.mediaAsset.upsert({
        where: { publicId: `demo/proofs/${demoOrder.orderNumber}` },
        update: { ownerId: customer.id, kind: "PAYMENT_PROOF" },
        create: {
          publicId: `demo/proofs/${demoOrder.orderNumber}`,
          ownerId: customer.id,
          kind: "PAYMENT_PROOF",
          mimeType: "image/svg+xml",
        },
      });
      paymentProofId = proof.id;
    }

    const created = await prisma.order.create({
      data: {
        orderNumber: demoOrder.orderNumber,
        userId: customer.id,
        status: demoOrder.status,
        paymentMethod: demoOrder.paymentMethod,
        subtotalCentavos,
        shippingCentavos,
        totalCentavos: subtotalCentavos + shippingCentavos,
        shippingAddress,
        contactName: "Mika Santos",
        contactEmail: customer.email,
        contactPhone: "09171234567",
        paymentReference: demoOrder.paymentReference ?? null,
        paymentProofId: paymentProofId ?? null,
        stripeCheckoutSessionId: demoOrder.stripeCheckoutSessionId ?? null,
        stripePaymentIntentId: demoOrder.stripePaymentIntentId ?? null,
        idempotencyKey: `seed-${demoOrder.orderNumber.toLowerCase()}`,
        paidAt: demoOrder.paidAt ?? null,
        shippedAt: demoOrder.shippedAt ?? null,
        deliveredAt: demoOrder.deliveredAt ?? null,
        cancelledAt: demoOrder.cancelledAt ?? null,
        createdAt: demoOrder.createdAt,
        items: { create: lines },
        events: {
          create: demoOrder.events.map((event, index) => ({
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            note: event.note,
            actorId: index === 0 ? null : adminId,
            createdAt: new Date(demoOrder.createdAt.getTime() + index * 60 * 60 * 1000),
          })),
        },
      },
    });

    console.log(`Demo order ready: ${created.orderNumber}`);
  }

  const reviews = [
    {
      productSlug: "mango-ice-nic-salt",
      rating: 5,
      title: "Daily driver",
      body: "The mango is sweet without being candy-like and the ice is just right. No coil gunk after a week in my pod.",
    },
    {
      productSlug: "neon-blast-disposable",
      rating: 4,
      title: "Great flavour, wish it lasted longer",
      body: "Lychee menthol is refreshing and the draw is smooth. Lasted about four days of regular use.",
    },
  ];

  for (const review of reviews) {
    const product = await prisma.product.findUnique({ where: { slug: review.productSlug } });
    if (!product) continue;
    await prisma.review.upsert({
      where: { userId_productId: { userId: customer.id, productId: product.id } },
      update: {
        rating: review.rating,
        title: review.title,
        body: review.body,
        verifiedPurchase: true,
      },
      create: {
        userId: customer.id,
        productId: product.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        verifiedPurchase: true,
        createdAt: daysAgo(4),
      },
    });
  }

  console.log(`Demo customer ready: ${customer.email} / ${DEMO_PASSWORD}`);
}

async function main() {
  await seedCategories();
  const admin = await seedAdmin();

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedDemoData(admin.id);
  } else {
    console.log("Demo data skipped (set SEED_DEMO_DATA=true to enable).");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
