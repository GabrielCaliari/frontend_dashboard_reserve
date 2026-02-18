# Leads CRUD Implementation - API v2

Complete implementation of the Leads management system integrated with the new API.

## 📁 Structure

### Types (`src/common/@types/@lead.ts`)
- `Lead` - Main lead entity
- `LeadCollection` - Lead collection entity
- `LeadOrigin` - Enum for lead sources
- `LeadStatus` - Enum for lead statuses
- `CollectionAccessMode` - Enum for collection access modes
- DTOs for create/update operations

### Services (`src/common/services/leads/`)
- `list-leads-service.ts` - GET /leads (paginated)
- `get-lead-service.ts` - GET /leads/:id
- `create-lead-service.ts` - POST /leads
- `update-lead-status-service.ts` - PUT /leads/:id/status
- `list-collections-service.ts` - GET /leads/leads/collections
- `create-collection-service.ts` - POST /leads/leads/collections
- `update-collection-service.ts` - PUT /leads/leads/collections/:id
- `delete-collection-service.ts` - DELETE /leads/leads/collections/:id
- `get-collection-service.ts` - GET /leads/leads/collections/:id
- `regenerate-collection-key-service.ts` - POST /leads/leads/collections/:id/regenerate-key
- `get-collection-leads-service.ts` - GET /leads/leads/collections/:id/leads

### Actions (`src/common/actions/leads/`)
Server actions with 'use server' directive:
- `list-leads.tsx`
- `get-lead.tsx`
- `create-lead.tsx`
- `update-lead-status.tsx`
- `list-collections.tsx`
- `create-collection.tsx`
- `update-collection.tsx`
- `delete-collection.tsx`

### Hooks (`src/common/hooks/leads/`)
React Query hooks for data fetching and mutations:
- `use-list-leads.ts` - Query for listing leads
- `use-get-lead.ts` - Query for single lead
- `use-create-lead.ts` - Mutation for creating leads
- `use-update-lead-status.ts` - Mutation for updating status
- `use-list-collections.ts` - Query for listing collections
- `use-create-collection.ts` - Mutation for creating collections
- `use-update-collection.ts` - Mutation for updating collections
- `use-delete-collection.ts` - Mutation for deleting collections

### Schemas (`src/common/schemas/lead-schema.ts`)
Zod validation schemas:
- `createLeadSchema`
- `updateLeadStatusSchema`
- `createCollectionSchema`
- `updateCollectionSchema`

### Components

#### Tables
- `src/components/tables/leads-table-v2.tsx` - Main leads table with pagination
- `src/components/tables/collections-table.tsx` - Collections management table

#### Modals
- `src/components/modals/lead-detail-modal.tsx` - View and edit lead details
- `src/components/modals/create-collection-modal.tsx` - Create new collection

#### Pages
- `src/app/dashboard/leads-v2/page.tsx` - Main leads management page

## 🎯 Features

### Lead Management
- ✅ List leads with pagination
- ✅ View lead details
- ✅ Update lead status
- ✅ Filter by status
- ✅ Archive leads

### Collection Management
- ✅ Create collections with access modes:
  - Public (no restrictions)
  - Private (CORS-protected)
  - Restricted (API key required)
- ✅ List collections with pagination
- ✅ Update collection settings
- ✅ Deactivate collections
- ✅ Copy collection slug
- ✅ Copy endpoint URL
- ✅ Regenerate API keys for restricted collections
- ✅ View leads by collection

### Access Modes

#### Public
- Anyone can submit leads
- No authentication required
- Suitable for public landing pages

#### Private (CORS)
- Domain whitelist protection
- Only allowed domains can submit
- Suitable for known websites

#### Restricted (API Key)
- Requires `x-collection-key` header
- Secret key generated on creation
- Key shown only once
- Can regenerate key (invalidates old one)
- Suitable for API integrations

## 🔌 API Endpoints Used

### Leads
- `GET /leads?page=1&limit=30` - List leads
- `GET /leads/:id` - Get lead details
- `POST /leads` - Create lead
- `PUT /leads/:id/status` - Update lead status

### Collections
- `GET /leads/leads/collections?page=1&limit=10` - List collections
- `POST /leads/leads/collections` - Create collection
- `GET /leads/leads/collections/:id` - Get collection
- `PUT /leads/leads/collections/:id` - Update collection
- `DELETE /leads/leads/collections/:id` - Deactivate collection
- `POST /leads/leads/collections/:id/regenerate-key` - Regenerate API key
- `GET /leads/leads/collections/:id/leads?page=1&limit=30` - Get collection leads

### Lead Capture (Public Endpoint)
- `POST /leads/collect/:slug` - Submit lead to collection
  - Header: `x-collection-key` (for restricted collections)
  - Body: `CreateLeadDto`

## 🚀 Usage Examples

### Creating a Collection

```typescript
import { useCreateCollection } from '@/src/common/hooks/leads/use-create-collection';
import { CollectionAccessMode } from '@/src/common/@types/@lead';

const createCollection = useCreateCollection();

createCollection.mutate({
  name: "Landing Page Home",
  source: "website-main",
  access_mode: CollectionAccessMode.RESTRICTED,
});
```

### Listing Leads

```typescript
import { useListLeads } from '@/src/common/hooks/leads/use-list-leads';

const { data, isLoading } = useListLeads({ page: 1, limit: 30 });
const leads = data?.data?.leads || [];
```

### Updating Lead Status

```typescript
import { useUpdateLeadStatus } from '@/src/common/hooks/leads/use-update-lead-status';
import { LeadStatus } from '@/src/common/@types/@lead';

const updateStatus = useUpdateLeadStatus();

updateStatus.mutate({
  id: leadId,
  data: { status: LeadStatus.QUALIFIED }
});
```

### Submitting a Lead (External)

```bash
# Public collection
curl -X POST https://your-domain.com/api/leads/collect/landing-home \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "11999999999",
      "interest": "premium-plan"
    }
  }'

# Restricted collection
curl -X POST https://your-domain.com/api/leads/collect/landing-home \
  -H "Content-Type: application/json" \
  -H "x-collection-key: ck_live_abc123..." \
  -d '{
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

## 🎨 UI Features

- Dark theme consistent styling
- Responsive tables with pagination
- Real-time status updates
- Toast notifications for actions
- Copy-to-clipboard functionality
- Modal dialogs for details
- Dropdown menus for actions
- Status chips with colors
- Loading states
- Error handling

## 🔐 Security

- JWT authentication required for admin endpoints
- Tenant isolation (admins see only their tenant's data)
- API key authentication for restricted collections
- CORS protection for private collections
- Secret keys shown only once on creation

## 📝 Next Steps

1. Add bulk operations (import/export leads)
2. Add advanced filtering and search
3. Add lead assignment to campaigns
4. Add collection analytics dashboard
5. Add webhook notifications for new leads
6. Add lead scoring system
7. Add duplicate detection
8. Add lead merge functionality

## 🐛 Known Issues

None at the moment.

## 📚 Related Documentation

- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Migration Guide](./manual-atualizacao-client-nextjs.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
