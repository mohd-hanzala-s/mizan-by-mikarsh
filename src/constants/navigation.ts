import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  CalendarDays,
  Menu,
  Receipt,
  PiggyBank,
  Repeat,
  Landmark,
  Users,
  Target,
  Lightbulb,
  Vault,
  Bell,
  Info,
  Settings as SettingsIcon,
  User,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  primary: boolean
  children?: NavItem[]
}

export const PRIMARY_TABS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: LayoutDashboard, primary: true },
  { id: 'money', label: 'Money', path: '/money', icon: Wallet, primary: true },
  { id: 'wealth', label: 'Wealth', path: '/wealth', icon: TrendingUp, primary: true },
  { id: 'planner', label: 'Planner', path: '/planner', icon: CalendarDays, primary: true },
  { id: 'more', label: 'More', path: '/more', icon: Menu, primary: true },
]

export const NAV_CHILDREN: Record<string, NavItem[]> = {
  money: [
    {
      id: 'transactions',
      label: 'Transactions',
      path: '/transactions',
      icon: Receipt,
      primary: false,
    },
    { id: 'accounts', label: 'Accounts', path: '/accounts', icon: Wallet, primary: false },
    { id: 'budgets', label: 'Budgets', path: '/budgets', icon: PiggyBank, primary: false },
    { id: 'recurring', label: 'Recurring', path: '/recurring', icon: Repeat, primary: false },
    { id: 'loans', label: 'Loans', path: '/loans', icon: Landmark, primary: false },
    { id: 'bill-splits', label: 'Bill Splits', path: '/bill-splits', icon: Users, primary: false },
  ],
  wealth: [
    { id: 'goals', label: 'Goals', path: '/goals', icon: Target, primary: false },
    {
      id: 'investments',
      label: 'Investments',
      path: '/investments',
      icon: TrendingUp,
      primary: false,
    },
    { id: 'insights', label: 'Insights', path: '/insights', icon: Lightbulb, primary: false },
  ],
  planner: [
    { id: 'calendar', label: 'Calendar', path: '/calendar', icon: CalendarDays, primary: false },
    { id: 'vault', label: 'Vault', path: '/vault', icon: Vault, primary: false },
  ],
  more: [
    { id: 'settings', label: 'Settings', path: '/settings', icon: SettingsIcon, primary: false },
    { id: 'profile', label: 'Profile', path: '/profile', icon: User, primary: false },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      primary: false,
    },
    { id: 'about', label: 'About', path: '/about', icon: Info, primary: false },
  ],
}

export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_TABS, ...Object.values(NAV_CHILDREN).flat()]

/** Flat list kept for backward compatibility with TopAppBar title lookup. */
export const NAV_ITEMS = ALL_NAV_ITEMS
