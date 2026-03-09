/**
 * Mock data for demo mode — used when no backend API is available
 */

export const DEMO_USER = {
  id: 'demo-1',
  email: 'admin@dotlessagency.com',
  firstName: 'Demo',
  lastName: 'Admin',
  role: 'OWNER',
};

export const DEMO_TOKEN = 'demo-token';

export const dashboardStats = {
  ordersToday: 12,
  ordersThisWeek: 67,
  pendingTracking: 8,
  revenueThisMonth: '$24,580.00',
  newCustomersThisWeek: 15,
  recentOrders: [
    { id: '1', orderNumber: 'CD-10042', customer: { firstName: 'John', lastName: 'Smith' }, sourceWebsite: 'cabinets.deals', status: 'SHIPPED', createdAt: new Date().toISOString() },
    { id: '2', orderNumber: 'NC-20018', customer: { firstName: 'Sarah', lastName: 'Johnson' }, sourceWebsite: 'northvillecabinetry.com', status: 'PROCESSING', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', orderNumber: 'CD-10041', customer: { firstName: 'Mike', lastName: 'Davis' }, sourceWebsite: 'cabinets.deals', status: 'DELIVERED', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', orderNumber: 'NC-20017', customer: { firstName: 'Emily', lastName: 'Wilson' }, sourceWebsite: 'northvillecabinetry.com', status: 'PENDING', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: '5', orderNumber: 'CD-10040', customer: { firstName: 'Robert', lastName: 'Brown' }, sourceWebsite: 'cabinets.deals', status: 'SHIPPED', createdAt: new Date(Date.now() - 14400000).toISOString() },
  ],
  carrierUsage: [
    { carrier: 'XPO Logistics', count: 28 },
    { carrier: 'R+L Carriers', count: 19 },
    { carrier: 'SEFL', count: 12 },
    { carrier: 'FedEx Freight', count: 8 },
  ],
};

export const orders = {
  orders: [
    { id: '1', orderNumber: 'CD-10042', customer: { firstName: 'John', lastName: 'Smith' }, sourceWebsite: 'cabinets.deals', status: 'SHIPPED', carrierBooked: 'XPO Logistics', shippingCost: '$1,245.00', createdAt: new Date().toISOString() },
    { id: '2', orderNumber: 'NC-20018', customer: { firstName: 'Sarah', lastName: 'Johnson' }, sourceWebsite: 'northvillecabinetry.com', status: 'PROCESSING', carrierBooked: 'R+L Carriers', shippingCost: '$890.50', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', orderNumber: 'CD-10041', customer: { firstName: 'Mike', lastName: 'Davis' }, sourceWebsite: 'cabinets.deals', status: 'DELIVERED', carrierBooked: 'SEFL', shippingCost: '$1,102.00', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', orderNumber: 'NC-20017', customer: { firstName: 'Emily', lastName: 'Wilson' }, sourceWebsite: 'northvillecabinetry.com', status: 'PENDING', carrierBooked: null, shippingCost: '$675.00', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: '5', orderNumber: 'CD-10040', customer: { firstName: 'Robert', lastName: 'Brown' }, sourceWebsite: 'cabinets.deals', status: 'SHIPPED', carrierBooked: 'FedEx Freight', shippingCost: '$1,580.00', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: '6', orderNumber: 'CD-10039', customer: { firstName: 'Lisa', lastName: 'Anderson' }, sourceWebsite: 'cabinets.deals', status: 'DELIVERED', carrierBooked: 'XPO Logistics', shippingCost: '$920.00', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '7', orderNumber: 'NC-20016', customer: { firstName: 'David', lastName: 'Martinez' }, sourceWebsite: 'northvillecabinetry.com', status: 'PROCESSING', carrierBooked: 'R+L Carriers', shippingCost: '$1,340.00', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: '8', orderNumber: 'CD-10038', customer: { firstName: 'Jennifer', lastName: 'Taylor' }, sourceWebsite: 'cabinets.deals', status: 'SHIPPED', carrierBooked: 'SEFL', shippingCost: '$760.00', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  ],
  pagination: { total: 8, totalPages: 1 },
};

export const customers = {
  customers: [
    { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '(555) 123-4567', sourceWebsite: 'cabinets.deals', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), _count: { orders: 3 } },
    { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '(555) 234-5678', sourceWebsite: 'northvillecabinetry.com', createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), _count: { orders: 2 } },
    { id: '3', firstName: 'Mike', lastName: 'Davis', email: 'mike.davis@email.com', phone: '(555) 345-6789', sourceWebsite: 'cabinets.deals', createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), _count: { orders: 1 } },
    { id: '4', firstName: 'Emily', lastName: 'Wilson', email: 'emily.w@email.com', phone: '(555) 456-7890', sourceWebsite: 'northvillecabinetry.com', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), _count: { orders: 4 } },
    { id: '5', firstName: 'Robert', lastName: 'Brown', email: 'r.brown@email.com', phone: '(555) 567-8901', sourceWebsite: 'cabinets.deals', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), _count: { orders: 2 } },
    { id: '6', firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.a@email.com', phone: '(555) 678-9012', sourceWebsite: 'cabinets.deals', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), _count: { orders: 1 } },
  ],
  pagination: { totalPages: 1 },
};

export const trackingOrders = [
  { id: '2', orderNumber: 'NC-20018', customer: { firstName: 'Sarah', lastName: 'Johnson' }, carrierBooked: 'R+L Carriers', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', orderNumber: 'NC-20017', customer: { firstName: 'Emily', lastName: 'Wilson' }, carrierBooked: null, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: '7', orderNumber: 'NC-20016', customer: { firstName: 'David', lastName: 'Martinez' }, carrierBooked: 'R+L Carriers', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];
