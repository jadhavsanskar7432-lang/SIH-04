import {
  LayoutDashboard,
  Package,
  Building2,
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  Bell,
  ClipboardList,
  CalendarClock,
  TrendingUp,
} from 'lucide-react'

export const adminNavItems = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Inventory', path: 'inventory', icon: Package },
  { label: 'Hospitals', path: 'hospitals', icon: Building2 },
  { label: 'Vendors', path: 'vendors', icon: Users },
  { label: 'Orders', path: 'orders', icon: ShoppingCart },
  { label: 'Shipments', path: 'shipments', icon: Truck },
  { label: 'Analytics', path: 'analytics', icon: BarChart3 },
  { label: 'Alerts', path: 'alerts', icon: Bell },
]

export const hospitalNavItems = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Inventory', path: 'inventory', icon: Package },
  { label: 'Consumption', path: 'consumption', icon: ClipboardList },
  { label: 'Orders', path: 'orders', icon: ShoppingCart },
  { label: 'Shipments', path: 'shipments', icon: Truck },
  { label: 'Expiry', path: 'expiry', icon: CalendarClock },
  { label: 'Alerts', path: 'alerts', icon: Bell },
]

export const vendorNavItems = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Orders', path: 'orders', icon: ShoppingCart },
  { label: 'Shipments', path: 'shipments', icon: Truck },
  { label: 'Performance', path: 'performance', icon: TrendingUp },
]