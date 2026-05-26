# Design Document: Complete API Migration

## Overview

This design addresses the completion of the RESERVE Admin Dashboard API migration by fixing the authentication redirect loop and removing redundant authentication parameter passing from server actions. The root cause of the redirect loop is a timing issue between client-side cookie setting and server-side cookie availability in the Next.js 16 proxy pattern. The solution involves ensuring proper cookie propagation and simplifying the authentication flow by leveraging the existing API client interceptor.

## Architecture

### Current Architecture

```
┌─────────────────┐
│   Login Form    │ (Client Component)
│   (Client-side) │
└────────┬────────┘
         │ 1. Submit credentials
         ▼
┌─────────────────────────┐
│ useAdminAuthentication  │ (Client Hook)
│      Hook               │
└────────┬────────────────┘
         │ 2. Call server action
         ▼
┌─────────────────────────┐
│   adminLogin Action     │ (Server Action)
│   (Server-side)         │
└────────┬────────────────┘
         │ 3. API call
         ▼
┌─────────────────────────┐
│   Authentication API    │
│   (DDD Backend)         │
└────────┬────────────────┘
         │ 4. Return session data
         ▼
┌─────────────────────────┐
│ useAdminAuthentication  │
│   setCookie (client)    │ ← PROBLEM: Cookies set client-side
└────────┬────────────────┘
         │ 5. Immediate redirect
         ▼
┌─────────────────────────┐
│   router.replace()      │
│   to /dashboard         │
└────────┬────────────────┘
         │ 6. Proxy checks cookies
         ▼
┌─────────────────────────┐
│   proxy.ts              │ ← PROBLEM: Cookies not yet available
│   (Server-side)         │    in server context
└─────────────────────────┘
```

### Problem Analysis

1. **Cookie Propagation Timing**: The `setCookie` function from `cookies-next` sets cookies client-side, but the Next.js proxy runs server-side. When `router.replace('/dashboard')` executes immediately after setting cookies, the proxy may not see the cookies yet.

2. **Redundant Parameter Passing**: Server actions retrieve cookies and pass them to services, but the API client interceptor already handles this automatically for client-side requests.

3. **Server vs Client Context**: The API interceptor only works in browser context (`typeof window !== 'undefined'`), so server actions cannot rely on it.

### Proposed Architecture

```
┌─────────────────┐
│   Login Form    │
│   (Client-side) │
└────────┬────────┘
         │ 1. Submit credentials
         ▼
┌─────────────────────────┐
│ useAdminAuthentication  │
│      Hook               │
└────────┬────────────────┘
         │ 2. Call server action
         ▼
┌─────────────────────────┐
│   adminLogin Action     │
│   (Server-side)         │
│   - Calls API           │
│   - Sets cookies via    │
│     Next.js cookies()   │ ← FIX: Server-side cookie setting
└────────┬────────────────┘
         │ 3. Return success
         ▼
┌─────────────────────────┐
│ useAdminAuthentication  │
│   (No cookie setting)   │ ← FIX: Remove client-side setCookie
└────────┬────────────────┘
         │ 4. Redirect after server confirms
         ▼
┌─────────────────────────┐
│   router.replace()      │
│   to /dashboard         │
└────────┬────────────────┘
         │ 5. Proxy checks cookies
         ▼
┌─────────────────────────┐
│   proxy.ts              │ ← FIX: Cookies available
│   (Server-side)         │    in server context
└─────────────────────────┘

For API Requests:
┌─────────────────────────┐
│   Component/Hook        │
│   (Client-side)         │
└────────┬────────────────┘
         │ 1. Call server action
         ▼
┌─────────────────────────┐
│   Server Action         │
│   (No cookie retrieval) │ ← FIX: Remove cookie passing
└────────┬────────────────┘
         │ 2. Call service directly
         ▼
┌─────────────────────────┐
│   Service               │
│   (Uses API client)     │
└────────┬────────────────┘
         │ 3. API request
         ▼
┌─────────────────────────┐
│   API Client            │
│   Interceptor adds      │
│   headers from cookies  │ ← Automatic header injection
└─────────────────────────┘
```

## Components and Interfaces

### 1. Authentication Flow Components

#### adminLogin Server Action (Modified)

```typescript
'use server';

import { cookies } from "next/headers";
import { adminLoginService } from "../services/admin-login-service";

export const adminLogin = async ({ email, password }: LoginCredentials) => {
    const result = await adminLoginService({ email, password });

    if (result.session_token) {
        const cookieStore = await cookies();
        
        // Set cookies server-side
        cookieStore.set('token', result.session_token, {
            maxAge: 60 * 60 * 24,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        
        cookieStore.set('session-code', result.session_id, {
            maxAge: 60 * 60 * 24,
            httpOnly: false, // Needed for client-side interceptor
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        
        // Set user detail cookies
        cookieStore.set('session-name', result.details.name, {
            maxAge: 60 * 60 * 24,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        
        cookieStore.set('session-email', result.details.email, {
            maxAge: 60 * 60 * 24,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        
        cookieStore.set('session-role', result.details.role, {
            maxAge: 60 * 60 * 24,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        
        return { success: true, data: result };
    }

    return { success: false, error: result };
}
```

#### useAdminAuthentication Hook (Modified)

```typescript
'use client'

import toast from "react-hot-toast";
import { LoginCredentials } from "@/src/common/@types/@auth";
import { adminLogin } from "../actions/admin-login";
import { errorTypes } from "../config/error-types";

export default function useAdminAuthentication() {
    const execAdminAuthentication = async ({ email, password }: LoginCredentials) => {
        const result = await adminLogin({ email, password });

        if (result.success) {
            return true;
        }

        // Handle errors
        switch (result.error) {
            case errorTypes._401.admin_email_nf:
                toast.error('Não foi possível autenticar.');
                break;
            case errorTypes._401.admin_password_in:
                toast.error('Não foi possível autenticar.');
                break;
            default:
                toast.error('Ops... Deu erro.');
        }

        return false;
    }

    return { execAdminAuthentication };
}
```

### 2. Server Actions (Simplified)

#### listLeads Action (Modified)

```typescript
'use server';

import { listLeadsService } from "../services/list-leads-service";

export const listLeads = async (page: number = 1) => {
    const result = await listLeadsService({ page });
    return result;
}
```

#### listLeadQualification Action (Modified)

```typescript
'use server'

import { listLeadQualificationService } from '../services/list-lead-qualification-service';
import { ILeadQualificationMessage } from '@/src/interfaces/lead-qualification.interface';

export async function listLeadQualification() {
    const result = await listLeadQualificationService();

    const keys = Object.keys(result);

    return keys.map((key: string) => {
        const messages = result[key] as ILeadQualificationMessage[];

        return {
            message_id: key,
            lead_name: messages[0].profile_name,
            phone_number: messages[0].phone_number,
            card: messages[0].kb_card,
            screening_complete: messages[0].screening_complete,
            temperature: messages[0].temperature,
            analyzed: messages[0].analyzed,
            messages
        }
    });
}
```

#### updateLeadQualification Action (Modified)

```typescript
'use server'

import { updateLeadQualificationService } from '../services/update-lead-qualification-service';

export async function updateLeadQualification(leadId: string, card: string) {
    return updateLeadQualificationService({
        lead_id: leadId,
        card: card
    });
}
```

#### completeScreening Action (Modified)

```typescript
'use server'

import { completeScreeningService } from '../services/complete-screening-service';

export async function completeScreening(leadId: string) {
    return completeScreeningService({ lead_id: leadId });
}
```

#### temperatureAnalysisByMessageId Action (Modified)

```typescript
'use server'

import { temperatureAnalysisByMessageIdService } from "../services/temperature-analysis-by-message-id-service";

export async function temperatureAnalysisByMessageId(messageId: string) {
    return temperatureAnalysisByMessageIdService({ message_id: messageId });
}
```

### 3. Service Layer (No Changes Needed)

Services remain unchanged as they already expect no authentication parameters:

```typescript
// Example: list-leads-service.ts
export const listLeadsService = async ({ page = 1 }: { page?: number }) => {
    try {
        const response = await api.get('/auth/leads', {
            params: { page }
        });

        if (response.status !== 200) {
            throw response.data;
        }

        return response.data;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }
        return errorTypes._500.list_leads;
    }
}
```

### 4. API Client Interceptor (No Changes Needed)

The existing interceptor already handles automatic header injection correctly:

```typescript
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-code='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (sessionId) {
        config.headers['session-id'] = sessionId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

## Data Models

### LoginCredentials Interface

```typescript
interface LoginCredentials {
    email: string;
    password: string;
}
```

### AuthenticationResponse Interface

```typescript
interface AuthenticationResponse {
    session_token: string;
    session_id: string;
    details: {
        name: string;
        email: string;
        role: string;
    }
}
```

### ActionResult Interface

```typescript
interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
```

### Service Parameter Interfaces (Updated)

```typescript
// Before (with authentication)
interface ListLeadsParams {
    token: string;
    session: string;
    page?: number;
}

// After (without authentication)
interface ListLeadsParams {
    page?: number;
}

// Before
interface UpdateLeadQualificationParams {
    token: string;
    session: string;
    lead_id: string;
    card: string;
}

// After
interface UpdateLeadQualificationParams {
    lead_id: string;
    card: string;
}

// Before
interface CompleteScreeningParams {
    token: string;
    session: string;
    lead_id: string;
}

// After
interface CompleteScreeningParams {
    lead_id: string;
}

// Before
interface TemperatureAnalysisParams {
    token: string;
    session: string;
    message_id: string;
}

// After
interface TemperatureAnalysisParams {
    message_id: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication Cookie Completeness
*For any* valid login credentials, when authentication succeeds, all five required cookies (token, session-code, session-name, session-email, session-role) should be set with the correct values from the authentication response.
**Validates: Requirements 1.1**

### Property 2: Proxy Route Protection
*For any* request to protected routes (/dashboard/*), if a valid token cookie exists, the proxy should allow access; if no valid token exists, the proxy should redirect to /auth/login.
**Validates: Requirements 1.2, 1.5**

### Property 3: Authenticated User Root Redirect
*For any* request to the root path ("/") with a valid token cookie, the proxy should redirect to "/dashboard".
**Validates: Requirements 1.3**

### Property 4: Authenticated User Login Redirect
*For any* request to "/auth/login" with a valid token cookie, the proxy should redirect to "/dashboard".
**Validates: Requirements 1.4**

### Property 5: Server Actions Parameter Elimination
*For all* migrated server actions (list-leads, list-lead-qualification, update-lead-qualification, complete-screening, temperature-analysis-by-message-id), the action should not retrieve cookies from Cookie_Store and should not pass token or session parameters to services.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 6: API Interceptor Header Injection
*For any* API request made in a browser context, the interceptor should automatically extract token and session-code cookies and inject them as Authorization (Bearer) and session-id headers respectively.
**Validates: Requirements 2.7, 3.1, 3.2**

### Property 7: Unauthorized Response Handling
*For any* API response with 401 status, the interceptor should clear all authentication cookies (token, session-code, session-name, session-email, session-role) and redirect to "/auth/login".
**Validates: Requirements 3.3, 3.4**

### Property 8: Interceptor Graceful Degradation
*For any* API request when cookies are not available in the browser context, the interceptor should proceed with the request without adding authentication headers and without throwing errors.
**Validates: Requirements 3.5**

### Property 9: Lead Listing Pagination
*For any* valid page number, the list-leads functionality should return paginated lead data with the correct page of results.
**Validates: Requirements 4.1**

### Property 10: Lead Qualification Grouping
*For any* lead qualification data returned from the API, the system should transform it into an array grouped by message_id with all message details preserved.
**Validates: Requirements 4.2**

### Property 11: Lead Qualification Update Persistence
*For any* lead and card value, updating the lead qualification should persist the change such that subsequent retrieval returns the updated card value.
**Validates: Requirements 4.3**

### Property 12: Screening Completion Persistence
*For any* lead, marking screening as complete should persist the change such that subsequent retrieval shows screening_complete as true.
**Validates: Requirements 4.4**

### Property 13: Temperature Analysis Retrieval
*For any* valid message_id, requesting temperature analysis should return temperature analysis data for that specific message.
**Validates: Requirements 4.5**

### Property 14: Lead Operation Authentication Error Handling
*For any* lead operation (list, qualify, update, screen, analyze) that receives a 401 response, the system should trigger the interceptor's 401 handling flow (clear cookies and redirect).
**Validates: Requirements 4.6**

### Property 15: Lead Operation Response Format
*For any* successful lead operation, the returned data should conform to the expected TypeScript interface structure.
**Validates: Requirements 4.7**

### Property 16: Authenticated Route Access
*For any* protected route, when a user has a valid token cookie, the proxy should allow access without redirecting to login.
**Validates: Requirements 5.2**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**: When login fails due to invalid email or password, the system returns specific error codes (admin_email_nf, admin_password_in) which are displayed to the user via toast notifications.

2. **Token Expiration**: When an API request receives a 401 response, the interceptor automatically:
   - Clears all authentication cookies
   - Redirects to /auth/login
   - Prevents further API requests with stale credentials

3. **Cookie Propagation**: Server-side cookie setting via Next.js cookies() API ensures cookies are immediately available to the proxy, eliminating timing issues.

### Service Layer Errors

1. **API Communication Errors**: Services catch axios errors and return error codes from error.response.data.code or fallback to generic 500 error codes.

2. **Error Code Propagation**: Error codes flow from services → actions → hooks → components where they are handled appropriately (toast notifications, UI state updates).

3. **Type Safety**: All error responses are typed, ensuring compile-time verification of error handling logic.

### Proxy Errors

1. **Missing Token**: When protected routes are accessed without a token cookie, the proxy redirects to /auth/login.

2. **Invalid Token**: Invalid tokens are treated the same as missing tokens - redirect to login.

3. **Route Protection**: The proxy validates token presence before allowing access to /dashboard/* routes.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across all inputs

### Unit Testing Focus

Unit tests should cover:

1. **Authentication Flow Integration**:
   - Test successful login with valid credentials
   - Test failed login with invalid credentials
   - Test cookie setting in adminLogin action
   - Test redirect behavior after successful login

2. **Proxy Route Protection**:
   - Test redirect from "/" to "/dashboard" with valid token
   - Test redirect from "/auth/login" to "/dashboard" with valid token
   - Test redirect from "/dashboard" to "/auth/login" without token
   - Test access to protected routes with valid token

3. **Server Action Refactoring**:
   - Verify each action calls its service with correct parameters (no token/session)
   - Verify actions do not import or use cookies() API
   - Test error handling in actions

4. **API Interceptor**:
   - Test header injection with valid cookies
   - Test 401 response handling (cookie clearing and redirect)
   - Test graceful handling when cookies are missing
   - Mock document.cookie for browser context testing

5. **Lead Operations**:
   - Test list-leads with different page numbers
   - Test list-lead-qualification data transformation
   - Test update-lead-qualification with various card values
   - Test complete-screening flag update
   - Test temperature-analysis-by-message-id retrieval

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: complete-api-migration, Property {number}: {property_text}`

**Property Test Implementation**:

Each correctness property should be implemented as a property-based test:

1. **Property 1**: Generate random valid credentials, verify all 5 cookies are set
2. **Property 2**: Generate random protected routes, verify proxy behavior with/without token
3. **Property 3**: Generate random valid tokens, verify root path redirect
4. **Property 4**: Generate random valid tokens, verify login page redirect
5. **Property 5**: Verify all 5 actions have correct signatures (static analysis or runtime verification)
6. **Property 6**: Generate random API requests, verify headers are injected
7. **Property 7**: Generate random 401 responses, verify cookie clearing and redirect
8. **Property 8**: Test requests without cookies, verify graceful handling
9. **Property 9**: Generate random page numbers, verify pagination works
10. **Property 10**: Generate random qualification data, verify grouping transformation
11. **Property 11**: Generate random lead/card pairs, verify update persistence
12. **Property 12**: Generate random leads, verify screening completion persistence
13. **Property 13**: Generate random message IDs, verify temperature analysis retrieval
14. **Property 14**: Generate random lead operations with 401 responses, verify error handling
15. **Property 15**: Generate random successful responses, verify format compliance
16. **Property 16**: Generate random protected routes with valid tokens, verify access

### Testing Tools

- **Jest**: Test runner and assertion library
- **fast-check**: Property-based testing library
- **@testing-library/react**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for interceptor tests
- **next/navigation mocks**: Mock Next.js router for redirect testing

### Test Organization

```
__tests__/
├── unit/
│   ├── actions/
│   │   ├── admin-login.test.ts
│   │   ├── list-leads.test.ts
│   │   ├── list-lead-qualification.test.ts
│   │   ├── update-lead-qualification.test.ts
│   │   ├── complete-screening.test.ts
│   │   └── temperature-analysis-by-message-id.test.ts
│   ├── hooks/
│   │   └── use-user-authentication.test.ts
│   ├── interceptors/
│   │   └── api-interceptor.test.ts
│   └── proxy/
│       └── proxy.test.ts
└── property/
    ├── authentication-properties.test.ts
    ├── proxy-properties.test.ts
    ├── action-properties.test.ts
    ├── interceptor-properties.test.ts
    └── lead-operations-properties.test.ts
```

### Manual Testing Checklist

After automated tests pass, perform manual verification:

1. ✓ Log in with valid credentials → Should redirect to /dashboard
2. ✓ Access /dashboard without login → Should redirect to /auth/login
3. ✓ Access / with valid token → Should redirect to /dashboard
4. ✓ Access /auth/login with valid token → Should redirect to /dashboard
5. ✓ List leads from dashboard → Should display paginated leads
6. ✓ View lead qualification → Should display grouped messages
7. ✓ Update lead qualification card → Should persist change
8. ✓ Mark screening complete → Should update flag
9. ✓ View temperature analysis → Should display analysis data
10. ✓ Simulate token expiration (delete token cookie) → Should redirect to login on next API call
