import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin Users ──────────────────────────────────────────────────────────

  const ownerPassword = await bcrypt.hash('Admin@12345', 12);
  const staffPassword = await bcrypt.hash('Staff@12345', 12);

  const owner = await prisma.adminUser.upsert({
    where: { email: 'admin@dotlessagency.com' },
    update: {},
    create: {
      email: 'admin@dotlessagency.com',
      name: 'Admin Owner',
      password: ownerPassword,
      role: 'OWNER',
      isActive: true,
    },
  });

  const staff = await prisma.adminUser.upsert({
    where: { email: 'staff@dotlessagency.com' },
    update: {},
    create: {
      email: 'staff@dotlessagency.com',
      name: 'Staff Member',
      password: staffPassword,
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log(`Created admin users: ${owner.email}, ${staff.email}`);

  // ─── Customers ────────────────────────────────────────────────────────────

  const customersData = [
    { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', phone: '555-0101', sourceWebsite: 'CABINETS_DEALS' },
    { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', phone: '555-0102', sourceWebsite: 'CABINETS_DEALS' },
    { email: 'bob.wilson@example.com', firstName: 'Bob', lastName: 'Wilson', phone: '555-0103', sourceWebsite: 'NORTHVILLE_CABINETRY' },
    { email: 'alice.johnson@example.com', firstName: 'Alice', lastName: 'Johnson', phone: '555-0104', sourceWebsite: 'NORTHVILLE_CABINETRY' },
    { email: 'charlie.brown@example.com', firstName: 'Charlie', lastName: 'Brown', phone: '555-0105', sourceWebsite: 'CABINETS_DEALS' },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
    customers.push(customer);
  }

  console.log(`Created ${customers.length} customers`);

  // ─── Orders ───────────────────────────────────────────────────────────────

  const statuses = ['PENDING', 'PROCESSING', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'ON_HOLD'];
  const carriers = ['XPO', 'RL_CARRIERS', 'SEFL', 'FEDEX_FREIGHT'];
  const websites = ['CABINETS_DEALS', 'NORTHVILLE_CABINETRY'];

  const ordersData = [];
  for (let i = 1; i <= 15; i++) {
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];
    const website = websites[i % websites.length];
    const carrier = carriers[i % carriers.length];
    const hasTracking = ['IN_TRANSIT', 'DELIVERED'].includes(status);
    const cabinetCount = 5 + (i % 20);
    const cabinetType = i % 2 === 0 ? 'RTA' : 'ASSEMBLED';
    const baseWeight = cabinetType === 'RTA' ? 65 : 110;
    const totalWeight = cabinetCount * baseWeight;

    const daysAgo = 30 - (i * 2);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.max(daysAgo, 0));

    ordersData.push({
      orderNumber: `SP-2026-${String(i).padStart(5, '0')}`,
      magentoOrderId: `MAG-${String(1000 + i)}`,
      sourceWebsite: website,
      status,
      customerId: customer.id,
      trackingNumber: hasTracking ? `TRK${String(100000 + i)}` : null,
      carrierBooked: hasTracking || status === 'BOOKED' ? carrier : null,
      estimatedDelivery: hasTracking ? new Date(Date.now() + 5 * 86400000) : null,
      actualDelivery: status === 'DELIVERED' ? new Date(Date.now() - 2 * 86400000) : null,
      totalAmount: 800 + (i * 150),
      shippingCost: 200 + (i * 25),
      createdAt,
      shipmentDetails: {
        originZip: '30301',
        destinationZip: `${90210 + i}`,
        destinationCity: 'Los Angeles',
        destinationState: 'CA',
        cabinetCount,
        cabinetType,
        hasLazySusan: i % 3 === 0,
        lazySusanQty: i % 3 === 0 ? 1 : null,
        hasVentHood: i % 4 === 0,
        ventHoodQty: i % 4 === 0 ? 1 : null,
        hasDrawers: i % 5 === 0,
        drawerQty: i % 5 === 0 ? 2 : null,
        deliveryLocationType: i % 2 === 0 ? 'RESIDENTIAL' : 'COMMERCIAL',
        deliveryMethod: i % 3 === 0 ? 'INSIDE_DELIVERY' : 'CURBSIDE',
        appointmentRequired: i % 4 === 0,
        estimatedWeight: totalWeight,
        freightClass: '92.5',
        estimatedPallets: Math.ceil(totalWeight / 1500),
      },
      rateQuotes: carriers.slice(0, 3 + (i % 2)).map((c, j) => ({
        carrier: c,
        serviceLevel: 'Standard LTL',
        totalCost: 250 + (j * 50) + (i * 10),
        transitDays: 3 + j,
        estimatedDelivery: new Date(Date.now() + (3 + j) * 86400000),
        rawResponse: JSON.stringify({ mock: true, carrier: c }),
        isSelected: j === 0,
      })),
    });
  }

  for (const orderData of ordersData) {
    const { shipmentDetails, rateQuotes, ...orderFields } = orderData;

    const order = await prisma.order.create({
      data: {
        ...orderFields,
        shipmentDetails: { create: shipmentDetails },
        rateQuotes: { create: rateQuotes },
      },
    });

    // Create audit logs for each order
    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        action: 'ORDER_CREATED',
        newValue: `Order ${order.orderNumber} created`,
        performedBy: 'SEED_SCRIPT',
      },
    });

    if (order.status !== 'PENDING') {
      await prisma.auditLog.create({
        data: {
          orderId: order.id,
          action: 'STATUS_CHANGED',
          oldValue: 'PENDING',
          newValue: order.status,
          performedBy: 'SEED_SCRIPT',
        },
      });
    }

    if (order.trackingNumber) {
      await prisma.auditLog.create({
        data: {
          orderId: order.id,
          action: 'TRACKING_ADDED',
          newValue: order.trackingNumber,
          performedBy: 'SEED_SCRIPT',
        },
      });
    }
  }

  console.log(`Created ${ordersData.length} orders with shipment details, rate quotes, and audit logs`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
