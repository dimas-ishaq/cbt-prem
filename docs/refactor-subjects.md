# Refactor Subjects Page

## Overview
- Split the large `page.tsx` into focused, reusable components.
- Introduced components:
  - `SubjectCardStats`
  - `SubjectSearch`
  - `SubjectActions`
  - `SubjectTable`
  - `SubjectModal`
  - `ImportControls`
- Moved API logic to `useSubjects` hook for cleaner separation of concerns.

## Files Added
- `apps/web/src/components/admin/subjects/components/SubjectCardStats.tsx`
- `apps/web/src/components/admin/subjects/components/SubjectSearch.tsx`
- `apps/web/src/components/admin/subjects/components/SubjectActions.tsx`
- `apps/web/src/components/admin/subjects/components/SubjectTable.tsx`
- `apps/web/src/components/admin/subjects/components/SubjectModal.tsx`
- `apps/web/src/components/admin/subjects/hooks/useSubjects.ts`

## Benefits
- Smaller, single‑responsibility components improve readability and maintainability.
- Easier unit testing and reuse across other pages.
- Clear data flow: UI components receive props from the hook, reducing duplicated logic.

## Next Steps
- Ensure all imports compile (`npm run dev` or `bun dev`).
- Run the full test suite to verify behavior.
- Merge changes and update CI pipelines if needed.