# Implementation Plan: Complete API Migration

## Overview

This implementation plan addresses the completion of the ZARP Admin Dashboard API migration by fixing the authentication redirect loop and removing redundant authentication parameter passing from server actions. The approach involves moving cookie management to server-side in the adminLogin action, simplifying the five lead-related server actions to remove cookie retrieval and parameter passing, and verifying the complete authentication flow works end-to-end.

## Tasks

- [ ] 1. Fix authentication redirect loop by moving cookie management server-side
  - [ ] 1.1 Update adminLogin server action to set cookies using Next.js cookies() API
    - Modify src/common/actions/admin-login.ts to use cookies() from 'next/headers'
    - Set all 5 cookies (token, session-code, session-name, session-email, session-role) with proper options
    - Configure httpOnly: true for token, httpOnly: false for others (needed by client interceptor)
    - Set secure: true in production, sameSite: 'lax', path: '/'
    - Return structured response { success: boolean, data?: AuthResponse, error?: string }
    - _Requirements: 1.1, 1.7, 5.6_
  
  - [ ] 1.2 Update useAdminAuthentication hook to remove client-side cookie setting
    - Remove all setCookie calls from src/common/hooks/use-user-authentication.ts
    - Update to handle new structured response from adminLogin action
    - Keep error handling logic with toast notifications
    - Return boolean success indicator to login form
    - _Requirements: 1.1, 1.6_
  
  - [ ]* 1.3 Write unit tests for authentication flow
    - Test adminLogin action sets all 5 cookies correctly
    - Test useAdminAuthentication hook handles success/error responses
    - Test error code mapping to toast messages
    - Mock cookies() API and adminLogin action
    - _Requirements: 1.1, 5.1_

- [ ] 2. Remove redundant authentication parameter passing from server actions
  - [ ] 2.1 Update list-leads action
    - Remove cookies() import and cookie retrieval from src/common/actions/list-leads.ts
    - Update listLeadsService call to pass only { page } parameter
    - Keep page parameter handling
    - _Requirements: 2.1, 2.6_
  
  - [ ] 2.2 Update list-lead-qualification action
    - Remove cookies() import and cookie retrieval from src/common/actions/list-lead-qualification.ts
    - Update listLeadQualificationService call to pass no parameters
    - Keep data transformation logic (grouping by message_id)
    - _Requirements: 2.2, 2.6_
  
  - [ ] 2.3 Update update-lead-qualification action
    - Remove cookies() import and cookie retrieval from src/common/actions/update-lead-qualification.ts
    - Update updateLeadQualificationService call to pass only { lead_id, card } parameters
    - _Requirements: 2.3, 2.6_
  
  - [ ] 2.4 Update complete-screening action
    - Remove cookies() import and cookie retrieval from src/common/actions/complete-screening.ts
    - Update completeScreeningService call to pass only { lead_id } parameter
    - _Requirements: 2.4, 2.6_
  
  - [ ] 2.5 Update temperature-analysis-by-message-id action
    - Remove cookies() import and cookie retrieval from src/common/actions/temperature-analysis-by-message-id.ts
    - Update temperatureAnalysisByMessageIdService call to pass only { message_id } parameter
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 2.6 Write property test for server actions parameter elimination
    - **Property 5: Server Actions Parameter Elimination**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    - Verify all 5 actions do not import cookies() from 'next/headers'
    - Verify service calls have correct signatures (no token/session parameters)
    - Use static analysis or runtime verification

- [ ] 3. Checkpoint - Verify authentication flow works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Write property tests for API interceptor functionality
  - [ ]* 4.1 Write property test for header injection
    - **Property 6: API Interceptor Header Injection**
    - **Validates: Requirements 2.7, 3.1, 3.2**
    - Generate random API requests in browser context
    - Mock document.cookie with token and session-code
    - Verify Authorization and session-id headers are added
    - Use fast-check for property-based testing
  
  - [ ]* 4.2 Write property test for 401 response handling
    - **Property 7: Unauthorized Response Handling**
    - **Validates: Requirements 3.3, 3.4**
    - Generate random 401 responses
    - Verify all 5 authentication cookies are cleared
    - Verify redirect to /auth/login occurs
    - Mock window.location and document.cookie
  
  - [ ]* 4.3 Write property test for graceful degradation
    - **Property 8: Interceptor Graceful Degradation**
    - **Validates: Requirements 3.5**
    - Test requests when cookies are not available
    - Verify requests proceed without headers
    - Verify no errors are thrown

- [ ] 5. Write property tests for proxy route protection
  - [ ]* 5.1 Write property test for proxy route protection
    - **Property 2: Proxy Route Protection**
    - **Validates: Requirements 1.2, 1.5**
    - Generate random protected routes (/dashboard/*)
    - Test with valid token cookie → should allow access
    - Test without token cookie → should redirect to /auth/login
    - Mock NextRequest and cookies
  
  - [ ]* 5.2 Write property test for authenticated user root redirect
    - **Property 3: Authenticated User Root Redirect**
    - **Validates: Requirements 1.3**
    - Generate random valid tokens
    - Test requests to "/" with token → should redirect to /dashboard
    - Mock NextRequest and cookies
  
  - [ ]* 5.3 Write property test for authenticated user login redirect
    - **Property 4: Authenticated User Login Redirect**
    - **Validates: Requirements 1.4**
    - Generate random valid tokens
    - Test requests to "/auth/login" with token → should redirect to /dashboard
    - Mock NextRequest and cookies

- [ ] 6. Write property tests for lead operations
  - [ ]* 6.1 Write property test for lead listing pagination
    - **Property 9: Lead Listing Pagination**
    - **Validates: Requirements 4.1**
    - Generate random page numbers (1-100)
    - Verify paginated lead data is returned
    - Mock API responses with MSW
  
  - [ ]* 6.2 Write property test for lead qualification grouping
    - **Property 10: Lead Qualification Grouping**
    - **Validates: Requirements 4.2**
    - Generate random qualification data from API
    - Verify transformation groups by message_id correctly
    - Verify all message details are preserved
  
  - [ ]* 6.3 Write property test for lead qualification update persistence
    - **Property 11: Lead Qualification Update Persistence**
    - **Validates: Requirements 4.3**
    - Generate random lead IDs and card values
    - Update qualification, then retrieve
    - Verify card value persisted correctly
    - Mock API with MSW
  
  - [ ]* 6.4 Write property test for screening completion persistence
    - **Property 12: Screening Completion Persistence**
    - **Validates: Requirements 4.4**
    - Generate random lead IDs
    - Mark screening complete, then retrieve
    - Verify screening_complete flag is true
    - Mock API with MSW
  
  - [ ]* 6.5 Write property test for temperature analysis retrieval
    - **Property 13: Temperature Analysis Retrieval**
    - **Validates: Requirements 4.5**
    - Generate random message IDs
    - Verify temperature analysis data is returned
    - Mock API with MSW
  
  - [ ]* 6.6 Write property test for lead operation error handling
    - **Property 14: Lead Operation Authentication Error Handling**
    - **Validates: Requirements 4.6**
    - Generate random lead operations
    - Simulate 401 responses
    - Verify interceptor 401 flow is triggered
    - Mock API with MSW

- [ ] 7. Write unit tests for integration scenarios
  - [ ]* 7.1 Write integration test for complete login flow
    - Test login with valid credentials
    - Verify cookies are set
    - Verify redirect to /dashboard occurs
    - Verify no redirect loop
    - _Requirements: 5.1_
  
  - [ ]* 7.2 Write integration tests for lead operations
    - Test list-leads returns data
    - Test list-lead-qualification returns grouped data
    - Test update-lead-qualification persists changes
    - Test complete-screening updates flag
    - Test temperature-analysis returns data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Final checkpoint - Verify all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and integration points
- The authentication fix is the highest priority (Task 1)
- Server action updates are straightforward refactoring (Task 2)
- Property tests provide comprehensive coverage across all inputs
- Manual testing checklist is in the design document
