# CMS Media Storage Frontend - Design Document

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pages      │───▶│  Components  │───▶│    Hooks     │  │
│  │  (Routes)    │    │   (UI)       │    │ (React Query)│  │
│  └──────────────┘    └──────────────┘    └───────┬──────┘  │
│                                                    │          │
│                                          ┌─────────▼──────┐  │
│                                          │  cms-api-client│  │
│                                          │    (Axios)     │  │
│                                          └────────┬───────┘  │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │  Backend API    │
                                          │  /api/cms/*     │
                                          │                 │
                                          │ ✅ Collections  │
                                          │ ✅ Assets       │
                                          │ ✅ Relations    │
                                          │ ✅ Vercel Blob  │
                                          └─────────────────┘
```

### 1.2 Layer Responsibilities

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **Pages** | Route handling, layout, data fetching orchestration | Next.js 16 App Router |
| **Components** | UI presentation, user interactions | React 19, NextUI |
| **Hooks** | Data fetching, mutations, cache management | React Query v5 |
| **API Client** | HTTP communication, auth, tenant headers | Axios, existing cms-api-client |
| **Types** | TypeScript interfaces and enums | TypeScript 5.9 |

---

## 2. Data Flow Architecture

### 2.1 Read Flow (Query)

```
User Action
    │
    ▼
Page Component
    │
    ▼
