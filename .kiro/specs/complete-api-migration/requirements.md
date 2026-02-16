# Requirements Document

## Introduction

This specification addresses the completion of the ZARP Admin Dashboard API migration from a monolithic architecture to a Domain-Driven Design (DDD) architecture. While 25 services have been successfully migrated to use the new API client with automatic header injection, several critical issues remain: the authentication flow redirects users back to the login page after successful login, and server actions continue to unnecessarily retrieve and pass authentication credentials to services that no longer require them.

## Glossary

- **API_Client**: The axios-based HTTP client configured with request/response interceptors for automatic authentication header injection
- **Server_Action**: Next.js server-side functions marked with 'use server' directive that execute on the server
- **Proxy**: Next.js 16 route protection mechanism (proxy.ts) that validates authentication and controls access to protected routes
- **Authentication_Headers**: The Authorization (Bearer token) and session-id headers required by the DDD API
- **Cookie_Store**: Next.js cookies() API for accessing HTTP cookies in server components and actions
- **Interceptor**: Axios middleware that automatically modifies requests/responses (adds headers, handles errors)
- **Lead_Qualification**: The process of screening and categorizing leads based on engagement and temperature analysis

## Requirements

### Requirement 1: Fix Authentication Redirect Loop

**User Story:** As an authenticated user, I want to successfully log in and be redirected to the dashboard, so that I can access the application after providing valid credentials.

#### Acceptance Criteria

1. WHEN a user submits valid credentials THEN THE Authentication_System SHALL store all required cookies (token, session-code, session-name, session-email, session-role)
2. WHEN authentication cookies are successfully stored THEN THE Proxy SHALL validate the token cookie and allow access to protected routes
3. WHEN a user with a valid token cookie accesses the root path ("/") THEN THE Proxy SHALL redirect to "/dashboard"
4. WHEN a user with a valid token cookie accesses "/auth/login" THEN THE Proxy SHALL redirect to "/dashboard"
5. WHEN a user without a valid token cookie accesses "/dashboard" THEN THE Proxy SHALL redirect to "/auth/login"
6. WHEN the login form receives a successful authentication response THEN THE Login_Form SHALL wait for cookie propagation before initiating navigation
7. WHEN cookies are set client-side THEN THE System SHALL ensure cookies are available to the Proxy before route evaluation

### Requirement 2: Remove Redundant Authentication Parameter Passing

**User Story:** As a developer, I want server actions to stop passing authentication parameters to services, so that the codebase follows the DRY principle and leverages the automatic header injection.

#### Acceptance Criteria

1. WHEN the list-leads action is invoked THEN THE Action SHALL call the service without token or session parameters
2. WHEN the list-lead-qualification action is invoked THEN THE Action SHALL call the service without token or session parameters
3. WHEN the update-lead-qualification action is invoked THEN THE Action SHALL call the service without token or session parameters
4. WHEN the complete-screening action is invoked THEN THE Action SHALL call the service without token or session parameters
5. WHEN the temperature-analysis-by-message-id action is invoked THEN THE Action SHALL call the service without token or session parameters
6. WHEN any server action calls a service THEN THE Action SHALL not retrieve token or session-code from the Cookie_Store
7. WHEN services are called without authentication parameters THEN THE API_Client interceptor SHALL automatically inject the required Authentication_Headers

### Requirement 3: Validate API Client Interceptor Functionality

**User Story:** As a developer, I want to verify that the API client interceptor correctly injects authentication headers, so that all API requests are properly authenticated without manual header management.

#### Acceptance Criteria

1. WHEN the API_Client makes a request in a browser context THEN THE Interceptor SHALL extract the token cookie and add it as an Authorization Bearer header
2. WHEN the API_Client makes a request in a browser context THEN THE Interceptor SHALL extract the session-code cookie and add it as a session-id header
3. WHEN the API_Client receives a 401 response THEN THE Interceptor SHALL clear all authentication cookies
4. WHEN the API_Client receives a 401 response THEN THE Interceptor SHALL redirect to "/auth/login"
5. WHEN cookies are not available in the browser context THEN THE Interceptor SHALL proceed with the request without adding authentication headers

### Requirement 4: Ensure Lead Management Functionality

**User Story:** As a user, I want all lead management features to work correctly after the migration, so that I can list, qualify, screen, and analyze leads without errors.

#### Acceptance Criteria

1. WHEN the list-leads functionality is invoked THEN THE System SHALL return paginated lead data
2. WHEN the list-lead-qualification functionality is invoked THEN THE System SHALL return grouped qualification messages by message_id
3. WHEN a lead qualification is updated THEN THE System SHALL persist the new card value for the specified lead
4. WHEN a screening is marked complete THEN THE System SHALL update the screening_complete flag for the specified lead
5. WHEN temperature analysis is requested for a message THEN THE System SHALL return temperature analysis data for the specified message_id
6. WHEN any lead operation fails due to authentication THEN THE System SHALL trigger the 401 interceptor flow
7. WHEN any lead operation succeeds THEN THE System SHALL return properly formatted data to the calling component

### Requirement 5: Verify End-to-End Authentication Flow

**User Story:** As a system administrator, I want to verify the complete authentication and authorization flow works correctly, so that the application is secure and functional.

#### Acceptance Criteria

1. WHEN a user logs in with valid credentials THEN THE System SHALL complete the full authentication flow without redirect loops
2. WHEN an authenticated user accesses protected routes THEN THE Proxy SHALL allow access based on the token cookie
3. WHEN an authenticated user makes API requests THEN THE API_Client SHALL automatically include Authentication_Headers
4. WHEN an authentication token expires THEN THE System SHALL redirect to login and clear all authentication cookies
5. WHEN a user logs out THEN THE System SHALL clear all authentication cookies and redirect to login
6. WHEN cookies are set during login THEN THE System SHALL ensure cookies are immediately available for subsequent requests
7. WHEN the Proxy evaluates routes THEN THE System SHALL use the current cookie state without caching issues
