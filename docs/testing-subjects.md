# Testing Guide – Subjects Refactor

## Objective
Ensure the new component split does not alter existing behaviour and that each component works as expected in isolation.

## Test Strategy
1. **Unit Tests**
   - Write tests for each component using React Testing Library.
   - Mock `useSubjects` to return static data.
   - Verify props passing: `subjects`, pagination callbacks, mutation handlers.
2. **Integration Test**
   - Render the full page (`page.tsx`) with mocked query results.
   - Simulate actions: add, edit, delete, import CSV.
   - Assert toast messages and query invalidation calls.
3. **End‑to‑End (E2E)**
   - Cypress scenario: navigate to `/admin/subjects`, perform a full add‑edit‑delete workflow.
   - Validate UI updates and correct API request payloads.

## Setup
```bash
# Install dev dependencies
bun add -d @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom cypress

# Add script entries in package.json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:e2e": "cypress open"
}
```

## Example – Mocking `useSubjects`
```tsx
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  delete: jest.fn(),
  post: jest.fn(),
}));
```

```tsx
// subjects.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SubjectsPage from '@/app/(teacher)/admin/subjects/page';
import { useSubjects } from '@/components/admin/subjects/hooks/useSubjects';

jest.mock('@/components/admin/subjects/hooks/useSubjects', () => ({
  useSubjects: jest.fn(),
}));

test('renders subject list when data loaded', () => {
  (useSubjects as jest.Mock).mockReturnValue({
    subjects: [{ id: '1', name: 'Matematika', code: 'MTK', description: '' }],
    isLoading: false,
  });

  render(<SubjectsPage />);
  expect(screen.getByText('Matematika')).toBeInTheDocument();
});
```

## CI Integration
- Add `npm run test` to the CI pipeline.
- Enforce `--coverage` thresholds ≥ 80 % for new code.
- Run `npm run test:e2e` on a dedicated CI job; fail the build on any uncaught error.

## Checklist Before Merge
- [ ] All component unit tests pass.
- [ ] Integration test verifies mutation calls and toast outcomes.
- [ ] E2E scenario completes without Cypress commands failing.
- [ ] Lint and typecheck (`npm run lint && bun run tsc --noEmit`) succeed.
- [ ] Updated `docs/refactor-subjects.md` reflects the new component layout.

---  
*Document generated for the refactor of the admin subjects page; keep it in sync with code changes.*