import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => React.createElement('span', { className, 'data-testid': 'badge' }, children),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled, 'data-testid': 'button' }, children),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => React.createElement('div', { 'data-testid': 'tabs' }, children),
  TabsList: ({ children }: any) => React.createElement('div', { 'data-testid': 'tabs-list' }, children),
  TabsTrigger: ({ children, value }: any) => React.createElement('button', { 'data-value': value, 'data-testid': 'tab-trigger' }, children),
  TabsContent: ({ children, value }: any) => React.createElement('div', { 'data-value': value, 'data-testid': 'tab-content' }, children),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) =>
    React.createElement('input', { type: 'checkbox', checked, onChange: (e: any) => onCheckedChange?.(e.target.checked), 'data-testid': 'switch' }),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => React.createElement('div', { 'data-testid': 'select' }, children),
  SelectTrigger: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-trigger' }, children),
  SelectValue: () => null,
  SelectContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-content' }, children),
  SelectItem: ({ children, value }: any) => React.createElement('div', { 'data-value': value }, children),
}));

vi.mock('@/components/ui/icons', () => ({
  PlusIcon: () => React.createElement('span', { 'data-testid': 'plus-icon' }),
  TrashIcon: () => React.createElement('span', { 'data-testid': 'trash-icon' }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (v: any) => v,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: null, isLoading: false })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AgencyPage', () => {
  let useAuth: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
  });

  it('renders no agency state when agency is null', async () => {
    (useAuth as any).mockReturnValue({
      agency: null,
      agencyRole: null,
      isAgencyOwner: false,
      isAgencyAdmin: false,
    });

    const AgencyPage = (await import('@/pages/dashboard/AgencyPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AgencyPage)));

    await waitFor(() => {
      expect(screen.getByText('No Agency')).toBeTruthy();
    });
  });

  it('renders agency settings tab', async () => {
    (useAuth as any).mockReturnValue({
      agency: { id: 'agency-1', name: 'Test Agency', slug: 'test-agency', brand_color: '#ff0000', owner_id: 'user-1', is_active: true, custom_domain: null, logo_url: null, favicon_url: null, created_at: null },
      agencyRole: 'owner',
      isAgencyOwner: true,
      isAgencyAdmin: false,
    });

    const AgencyPage = (await import('@/pages/dashboard/AgencyPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AgencyPage)));

    await waitFor(() => {
      expect(screen.getByText('Test Agency')).toBeTruthy();
      expect(screen.getByText('owner')).toBeTruthy();
    });
  });

  it('renders member management tab', async () => {
    (useAuth as any).mockReturnValue({
      agency: { id: 'agency-1', name: 'Test Agency', slug: 'test-agency', brand_color: '#ff0000', owner_id: 'user-1', is_active: true, custom_domain: null, logo_url: null, favicon_url: null, created_at: null },
      agencyRole: 'admin',
      isAgencyOwner: false,
      isAgencyAdmin: true,
    });

    const AgencyPage = (await import('@/pages/dashboard/AgencyPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AgencyPage)));

    await waitFor(() => {
      expect(screen.getByText('Test Agency')).toBeTruthy();
      expect(screen.getByText('admin')).toBeTruthy();
    });
  });

  it('renders enterprise settings tab', async () => {
    (useAuth as any).mockReturnValue({
      agency: { id: 'agency-1', name: 'Enterprise Agency', slug: 'enterprise', brand_color: '#00ff00', owner_id: 'user-1', is_active: true, custom_domain: null, logo_url: null, favicon_url: null, created_at: null },
      agencyRole: 'owner',
      isAgencyOwner: true,
      isAgencyAdmin: false,
    });

    const AgencyPage = (await import('@/pages/dashboard/AgencyPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AgencyPage)));

    await waitFor(() => {
      expect(screen.getByText('Enterprise Agency')).toBeTruthy();
    });
  });
});
