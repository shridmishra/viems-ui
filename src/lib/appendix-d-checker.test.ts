import { describe, it } from "node:test";
import assert from "node:assert";
import { checkAppendixDCompleteness, isCosAssignedStatus } from "./appendix-d-checker.ts";

describe("isCosAssignedStatus", () => {
  it("recognizes CoS Assigned and CoS Issued variants", () => {
    assert.strictEqual(isCosAssignedStatus("CoS Assigned"), true);
    assert.strictEqual(isCosAssignedStatus("cos_assigned"), true);
    assert.strictEqual(isCosAssignedStatus("CoS Issued"), true);
    assert.strictEqual(isCosAssignedStatus("ASSIGNED"), true);
    assert.strictEqual(isCosAssignedStatus("Draft"), false);
    assert.strictEqual(isCosAssignedStatus("Visa approved"), false);
    assert.strictEqual(isCosAssignedStatus(undefined), false);
  });
});

describe("checkAppendixDCompleteness", () => {
  const testCases = [
    {
      name: "empty files array returns incomplete with 0 attached",
      files: [],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 0,
      expectedMissingCount: 4,
      expectedIsComplete: false,
    },
    {
      name: "non-array files input (null/undefined/object) returns incomplete safely",
      files: null as unknown as Parameters<typeof checkAppendixDCompleteness>[0],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 0,
      expectedMissingCount: 4,
      expectedIsComplete: false,
    },
    {
      name: "match via filename",
      files: [
        { filename: "john_doe_passport_scan.pdf" },
        { filename: "equity_union_consultation_letter.pdf" },
        { filename: "filming_itinerary_schedule.pdf" },
        { filename: "signed_employment_contract.pdf" },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "match via file_type",
      files: [
        { file_type: "passport" },
        { file_type: "letterfrompromoter" },
        { file_type: "filmingschedule" },
        { file_type: "employee_contract" },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "match via filetype.value with nested object",
      files: [
        { filetype: { value: "migrantpassport" } },
        { filetype: { value: "consultation" } },
        { filetype: { value: "itineraryofevents" } },
        { filetype: { value: "fixed_term_contract" } },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "partial files returns incomplete with correct missing count",
      files: [
        { filename: "passport.pdf" },
        { filename: "contract.pdf" },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 2,
      expectedMissingCount: 2,
      expectedIsComplete: false,
    },
    {
      name: "passport number without file recorded in migrant/caseData satisfies passport requirement",
      files: [
        { filename: "union_letter.pdf" },
        { filename: "tour_schedule.pdf" },
        { filename: "employment_agreement.pdf" },
      ],
      migrant: { passport: { number: "GB123456789" }, personalInfo: { lastName: "Smith" } },
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "passport number recorded on caseData satisfies passport requirement",
      files: [
        { filename: "union_letter.pdf" },
        { filename: "tour_schedule.pdf" },
        { filename: "employment_agreement.pdf" },
      ],
      migrant: undefined,
      caseData: { passportNumber: "P987654321", name: "Jane Doe" },
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "single file matching multiple essentials (e.g. combined multi-role document)",
      files: [
        { filename: "union_contract_and_schedule.pdf" },
        { filename: "passport.pdf" },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
    {
      name: "handles non-string/numeric category without throwing",
      files: [
        { category: 18, filename: "doc1.pdf" }, // category 18 numeric matches passport
        { category: null, filename: "union.pdf" },
        { category: undefined, filename: "schedule.pdf" },
        { filetype: 123, filename: "contract.pdf" },
      ],
      migrant: undefined,
      caseData: undefined,
      expectedAttachedCount: 4,
      expectedMissingCount: 0,
      expectedIsComplete: true,
    },
  ];

  for (const tc of testCases) {
    it(tc.name, () => {
      const result = checkAppendixDCompleteness(tc.files, tc.migrant, tc.caseData);
      assert.strictEqual(
        result.attachedCount,
        tc.expectedAttachedCount,
        `expected ${tc.expectedAttachedCount} attached, got ${result.attachedCount}`
      );
      assert.strictEqual(
        result.missingCount,
        tc.expectedMissingCount,
        `expected ${tc.expectedMissingCount} missing, got ${result.missingCount}`
      );
      assert.strictEqual(
        result.isComplete,
        tc.expectedIsComplete,
        `expected isComplete ${tc.expectedIsComplete}, got ${result.isComplete}`
      );
    });
  }
});
