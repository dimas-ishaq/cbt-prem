# QA Test Plan - Create Exam Feature

## 1. Objective
Validate the exam creation flow from UI to API for teacher users.

## 2. Scope
In scope:
- `/admin/exams/create` UI
- `POST /exams` API
- required validation for questions and target rombels
- teacher resolution logic

Out of scope:
- exam session runtime
- grading
- analytics

## 3. Risk Audit
| Risk | Impact | Note |
| :--- | :--- | :--- |
| Missing teacher record | High | Controller falls back to first teacher for super admin only |
| Empty question selection | High | UI blocks submit but API should still be protected |
| Empty target rombel | High | UI blocks submit but API should still be protected |
| Mass assignment | Medium | API accepts `any` payload in update, not create |

## 4. Test Levels
### 4.1 Unit
- `ExamsService.create()` creates exam, examQuestions, targetRombels, targetMajors.
- `ExamsController.create()` resolves teacher correctly.

### 4.2 Integration
- Form submit payload reaches API with `startTime` and `endTime`.
- API rejects invalid roles and missing teacher cases.

### 4.3 UI
- Submit button disabled only by state, not by missing selections.
- Error toast appears for missing soal or rombel.

## 5. Execution Order
1. Unit tests for service.
2. Unit tests for controller.
3. UI test for create page.
4. Integration/API test for success and validation.

## 6. Acceptance Criteria
- Exam is created with valid payload.
- Missing soal or rombel is blocked.
- Teacher fallback behaves as expected.
- Test suite is deterministic and isolated.

## 7. Status
- Step 1: service spec drafted
- Step 2: controller spec drafted
- Step 3: UI test pending
- Step 4: integration test pending
