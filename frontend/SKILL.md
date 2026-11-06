# SKILL.md — Job Search Platform Frontend

## 1. Project Overview

Job Search Platform is an AI-powered web platform for automating the job search process.

The platform helps users manage their professional profiles, discover relevant job opportunities, evaluate their qualifications against employer requirements, generate tailored resumes and cover letters, submit applications, and track application statuses.

This repository contains the **frontend application**. The backend is developed separately using Java and Spring Boot.

The frontend must be responsive, performant, accessible, maintainable, and visually consistent with the approved Figma designs.

All paths in this document are relative to the frontend project root unless explicitly stated otherwise.

### Core Product Principles

- Users must retain control over their personal data and automated actions.
- Job discovery, resume preparation, and application submission are independent but interconnected workflows.
- AI-generated results must be understandable, verifiable, and editable.
- Automation must not conceal submitted applications, errors, or limitations from users.
- The interface must be usable on both mobile and desktop devices.
- Keep the design minimal and visually consistent with Figma.
- Develop independently of backend availability using typed mock data and API abstractions.
- Do not implement functionality outside the current task or approved requirements.

## 2. Technology Stack

Use the following proposed stack:

- React
- TypeScript with strict mode enabled
- Vite
- Tailwind CSS
- React Router for routing, when required and approved
- Vitest for unit testing
- React Testing Library for component testing
- Playwright for E2E and visual regression testing
- ESLint
- Prettier
- npm, unless an existing lockfile specifies another package manager

### Dependency Rules

- Use stable, mutually compatible dependency versions.
- Prefer built-in browser APIs and existing project dependencies.
- Do not introduce new frameworks, UI kits, state-management libraries, or large dependencies without clear justification.
- Do not replace approved technologies without explicit authorization.
- Avoid dependencies for small tasks that can be implemented using standard functionality.
- Follow existing project conventions unless they conflict with these instructions.

## 3. Figma as the Design Source of Truth

Approved design:

https://www.figma.com/design/mx3GXFyVP6U5plZJljLDcf

The Figma file contains desktop and mobile product concepts, including the candidate profile, dashboard, vacancy listings, vacancy analysis, applications, and automation.

### Design Implementation Rules

- Inspect relevant Figma frames, components, colors, typography, spacing, and dimensions before implementation.
- Use Figma MCP or an available Figma integration.
- Treat approved Figma designs as the source of truth for visual decisions.
- Reuse existing components and design tokens.
- Preserve visual hierarchy, proportions, typography, and element positioning.
- Implement responsive layouts for mobile and desktop.
- Do not create separate mobile and desktop applications unless explicitly required.
- Do not independently redesign approved screens.
- Do not silently invent missing Figma details.
- Document deviations from the approved designs.

The current designs represent a product concept. Details that have not yet been approved must not be treated as finalized requirements.

### Responsive Design

- Use a single React application with responsive layouts.
- Use sidebar navigation on desktop when specified by the design.
- Use bottom navigation on mobile when specified by the design.
- Prevent horizontal page overflow.
- Ensure comfortable interaction target sizes.
- Account for virtual keyboards, long vacancy titles, form errors, and small screens.
- Preserve consistent business logic across screen sizes.

## 4. Architecture and Project Structure

Prefer feature-oriented organization.

Suggested structure:

    src/
      app/
        router/
        providers/
      components/
        ui/
        layout/
      features/
        auth/
        candidate/
        resumes/
        vacancies/
        applications/
        automation/
        settings/
      lib/
        api/
        config/
        utils/
      types/
      mocks/
    tests/
    public/

### Directory Responsibilities

- `app` — application initialization, routing, and global providers.
- `components/ui` — reusable UI primitives.
- `components/layout` — navigation and shared layout components.
- `features` — components and logic for individual business features.
- `lib/api` — HTTP client, API contracts, and shared request infrastructure.
- `lib/config` — application configuration.
- `lib/utils` — shared utilities.
- `types` — genuinely shared types.
- `mocks` — typed test data and mock API implementations.
- `tests` — automated tests.
- `public` — static assets.

Do not create unnecessary directories or architectural layers.

Code used by only one feature should remain within that feature.

## 5. Engineering Principles

Apply KISS, SOLID, and DRY pragmatically.

### KISS — Keep It Simple, Stupid

- Choose the simplest solution that fully satisfies the requirements.
- Prefer readable, explicit code over complex abstractions.
- Avoid premature optimization.
- Do not introduce unnecessary wrappers, factories, managers, or configuration.
- Do not design extensibility for hypothetical requirements.

### SOLID

**Single Responsibility Principle (SRP)**

Each component, hook, and module must have a clear responsibility.

**Open/Closed Principle (OCP)**

Use composition and extension points where a real need exists.

**Liskov Substitution Principle (LSP)**

Interchangeable implementations must honor consistent contracts.

**Interface Segregation Principle (ISP)**

Prefer small, focused interfaces.

**Dependency Inversion Principle (DIP)**

Separate application logic from concrete APIs and external services.

Do not introduce classes, interfaces, or additional layers solely to demonstrate SOLID compliance.

### DRY — Don't Repeat Yourself

- Avoid duplicating business rules.
- Reuse components and design tokens.
- Extract shared abstractions when meaningful repetition exists.
- Do not combine unrelated code merely because it looks similar.

When principles conflict, prefer the solution that is easiest to understand, test, and maintain.

## 6. TypeScript and React Standards

- Enable TypeScript strict mode.
- Avoid `any` unless absolutely necessary and justified.
- Avoid unsafe type assertions and unnecessary non-null assertions.
- Define explicit types for API contracts and domain models.
- Use functional components.
- Prefer composition over inheritance.
- Avoid global state unless necessary.
- Do not duplicate derived state.
- Manage side effects explicitly and clean up resources.
- Use semantic HTML.
- Do not suppress TypeScript, React, or ESLint warnings merely to pass checks.
- Do not combine presentation, network requests, and complex business logic in a single component.

## 7. UI and Design System

- Use Tailwind CSS for styling.
- Define shared design tokens for colors, dimensions, spacing, radii, and typography.
- Do not duplicate arbitrary color values across components.
- Do not introduce a UI framework without authorization.
- Create reusable components for recurring interface patterns.
- Support `loading`, `empty`, `error`, `disabled`, `hover`, and `focus` states.
- Provide feedback for successful actions.
- Ensure keyboard accessibility.
- Respect `prefers-reduced-motion`.
- Avoid decorative animations that negatively affect usability or performance.

Implement light and dark themes after the corresponding designs have been approved.

## 8. Core Product Features

### 8.1. Candidate Profile

The candidate profile includes:

- Personal information.
- Desired job title.
- Preferred work arrangements.
- Salary expectations.
- Professional skills.
- Work experience.
- Uploaded resumes.

Requirements:

- Support profile viewing and editing.
- Validate user input.
- Display saving errors.
- Preserve entered data when API requests fail.
- Do not submit changes without an appropriate user action unless autosaving is explicitly required.
- Avoid storing sensitive information in the browser unnecessarily.

### 8.2. Resumes

Users must be able to:

- Upload resumes.
- View uploaded file information.
- Select a primary resume.
- Review AI analysis results.
- Verify and correct extracted information.
- Generate tailored resume versions for specific vacancies.

Requirements:

- Validate file type and size on the client.
- Do not treat client-side validation as a substitute for server-side validation.
- Display upload progress and errors.
- Do not present AI-generated results as verified facts until reviewed by the user.
- Do not fabricate professional experience, achievements, skills, or education.
- Keep original resumes separate from tailored versions.
- Do not overwrite the original document during personalization.

### 8.3. Job Search

The interface must support:

- Vacancy listings.
- Search and filtering.
- Sorting.
- Detailed vacancy information.
- Candidate-to-vacancy matching.
- Vacancy source identification.
- Navigation to the original posting.
- Loading, empty, and error states.

Do not generate fictional vacancies in production.

Mock vacancies are permitted only in development and testing environments.

### 8.4. Vacancy Matching Analysis

For each vacancy, the platform may display:

- Overall match score.
- Matching skills.
- Missing or unverified skills.
- Employer requirements.
- Resume-tailoring recommendations.

Requirements:

- Display match scores only when analysis results are available.
- Do not calculate fictional match percentages on the frontend.
- Do not present probabilistic AI conclusions as verified facts.
- Distinguish between a missing skill and missing information about a skill.
- Do not conceal analysis limitations.

### 8.5. Application Preparation

Users must be able to:

- Review the prepared resume.
- Review the cover letter.
- Edit the cover letter.
- Regenerate content.
- Monitor preparation progress.
- Submit applications when supported by the connected job source.

Requirements:

- Do not submit applications automatically when a page opens or a component rerenders.
- Prevent accidental duplicate submissions.
- Clearly display which resume and cover letter will be used.
- Explicitly display submission errors.
- Do not mark an application as successful until confirmed by the backend.
- Do not fabricate candidate achievements.

### 8.6. Application History

The interface must display:

- Vacancy and employer.
- Vacancy source.
- Submission date.
- Resume version used.
- Application status.
- Submission errors, when applicable.

Application statuses must follow the approved backend contract.

Do not assume that a lack of response means rejection.

### 8.7. Automation

The automation management interface must support:

- Viewing connected job sources.
- Configuring search parameters.
- Starting and stopping automation.
- Displaying the current execution state.
- Viewing execution history.
- Reviewing results and errors.
- Indicating when reauthentication is required.

Requirements:

- The frontend must not execute automation tasks independently.
- Task scheduling and execution belong to the backend or a dedicated worker.
- Do not store external platform passwords or tokens in the frontend.
- Do not claim successful submission without confirmation from the executor.
- Do not bypass external service restrictions.
- Do not perform bulk actions without explicitly configured user rules.
- Display partial execution states when supported by the API.

## 9. Backend Integration

The backend is developed separately using Java and Spring Boot.

Until API contracts are explicitly approved:

- Use typed mock data.
- Separate API models from UI components.
- Centralize HTTP requests.
- Do not invent permanent backend endpoints.
- Do not implement backend business logic in the frontend.
- Do not hardcode production URLs in components.
- Use environment variables for configuration.
- Never expose server-side secrets through client-side environment variables.
- Explicitly document assumptions requiring backend confirmation.

### Core Domain Entities

The frontend should account for the following concepts:

- `CandidateProfile`
- `WorkExperience`
- `Skill`
- `Resume`
- `Vacancy`
- `VacancyMatch`
- `CoverLetter`
- `JobApplication`
- `AutomationConfiguration`
- `AutomationRun`

These are conceptual names, not approved DTOs or API contracts.

Do not treat this list as a finalized data schema.

## 10. AI Functionality

The frontend must not call LLM providers directly using secret API keys.

All AI requests must be processed through the backend.

Requirements:

- Display progress for long-running operations.
- Handle timeouts and errors.
- Do not trigger regeneration because of component rerenders.
- Avoid sending duplicate requests unnecessarily.
- Allow users to retry failed operations.
- Preserve the distinction between original user data and AI-generated content.
- Allow users to review results before using them.
- Do not present generated information as verified by an employer or candidate.

## 11. Security and Privacy

The platform processes personal user information, including resumes and employment history.

- Do not log resumes, tokens, or personal information unnecessarily.
- Do not store secrets in source code.
- Do not use real personal information in test fixtures.
- Do not store sensitive data in `localStorage` without an explicit architectural decision.
- Do not expose one user's data to another user.
- Do not treat hiding UI elements as an authorization mechanism.
- Do not bypass server-side access checks.
- Do not include private information in public URLs.
- Do not transfer personal information to third-party services without an appropriate product-defined basis and authorization.

## 12. Performance and Accessibility

- Minimize client-side JavaScript.
- Lazy-load heavy application sections.
- Avoid unnecessary rerenders.
- Do not load entire large vacancy datasets when pagination is required.
- Do not block the interface during long-running operations.
- Use semantic HTML.
- Ensure keyboard accessibility.
- Provide appropriate form labels.
- Maintain visible focus indicators.
- Display understandable error messages.
- Prevent significant layout shifts during loading.

Performance optimizations must be justified by real requirements or measurements.

## 13. Testing and Quality Gates

For each completed feature:

1. Run TypeScript type checking.
2. Run ESLint.
3. Verify formatting.
4. Run the production build.
5. Add or update unit tests.
6. Run relevant Playwright E2E tests.
7. Verify desktop and mobile layouts.
8. Compare screenshots against Figma.
9. Check basic accessibility.
10. Report failed checks and known limitations.

### Testing Rules

- Unit test coverage must be at least **90% for lines and 90% for branches**, measured separately.
- Configure an automated quality gate for both coverage metrics.
- Cover new and modified logic with tests, including edge cases.
- Do not delete, weaken, or skip tests merely to obtain passing results.
- When a test fails, investigate the root cause first.
- Update test expectations only when justified by approved requirement changes.
- Add regression tests for bug fixes.
- Do not create meaningless tests solely to increase coverage.
- Use deterministic mock data.
- Prefer testing user-visible behavior over implementation details.
- Do not claim tests passed unless they actually ran.

### Visual Regression Testing

- Use Playwright for visual regression testing of important screens.
- Test mobile and desktop viewport sizes.
- Use stable fixtures.
- Eliminate instability caused by animations and dynamic timestamps.
- Do not increase screenshot comparison thresholds merely to pass tests.
- Update reference screenshots only after approved design changes.

## 14. Codex Workflow

### Before Implementation

1. Read `SKILL.md`.
2. Inspect the repository structure.
3. Review existing components and project conventions.
4. Inspect relevant Figma designs.
5. Identify reusable components and design tokens.
6. Prepare a concise implementation plan for nontrivial tasks.
7. Ask for clarification only when unresolved decisions materially affect implementation.

### During Implementation

- Work on one clearly scoped task at a time.
- Prefer small, reviewable changes.
- Follow the established project architecture.
- Reuse existing components.
- Do not modify the backend without explicit authorization.
- Do not refactor unrelated code.
- Do not introduce dependencies without justification.
- Do not change approved behavior without authorization.
- Do not overwrite unrelated user changes.
- Avoid generating unnecessary boilerplate.

### After Implementation

- Summarize implemented changes.
- List significant modified files.
- Report which checks were actually executed.
- Provide testing results.
- Identify deviations from Figma.
- Document remaining limitations.
- Explain newly introduced dependencies.
- Do not commit, push, or create pull requests unless explicitly requested.

### Architectural Self-Review

Before completing a task, verify:

- **KISS:** Is there a simpler solution?
- **SOLID:** Are responsibilities properly separated?
- **DRY:** Is meaningful duplication avoided?
- **Consistency:** Does the implementation follow the established architecture and design system?
- **Scope:** Was unrelated code left unchanged?
- **Quality:** Were the required checks executed?

Do not refactor code solely to satisfy engineering principles formally.

## 15. Definition of Done

A feature is complete only when:

- The requested behavior is implemented.
- Approved requirements are satisfied.
- The interface follows Figma.
- Appropriate existing components and tokens are reused.
- TypeScript checks pass.
- ESLint passes.
- The production build succeeds.
- Relevant tests pass.
- Line and branch coverage are both at least 90%.
- No known regressions are introduced.
- Responsive behavior is verified.
- Loading, error, and empty states are handled.
- Basic accessibility requirements are satisfied.
- Known limitations are documented.

If a check could not be performed, explicitly state why.

Do not report incomplete work as fully complete.

## 16. Instruction Priority

When instructions conflict, follow this priority:

1. Applicable security, privacy, and legal requirements.
2. Higher-priority runtime and tool instructions.
3. Explicit instructions for the current task.
4. Approved Figma designs for visual decisions.
5. Existing project architecture and conventions.
6. Default recommendations in this document.

When a decision would materially change product behavior, request clarification instead of making unsupported assumptions.