import { z } from "zod";

export const proposalSchema = z
  .object({
    proposalSource: z.string().min(1, "Choose a proposal source."),
    implementingDepartment: z.string().min(1, "Choose an implementing office."),
    requestingOffice: z.string().trim().min(2, "Enter the requesting office."),
    leadOfficer: z.string().trim().min(2, "Enter the responsible officer."),
    fiscalYear: z.string().min(1, "Choose a fiscal year."),
    emergency: z.boolean(),
    title: z.string().trim().min(8, "Use a descriptive project title."),
    description: z.string().trim().min(20, "Provide a short project description."),
    problemStatement: z.string().trim().min(30, "Describe the service gap or problem in more detail."),
    expectedOutcome: z.string().trim().min(20, "Describe the intended measurable outcome."),
    barangayScope: z.string().min(1, "Choose the project scope."),
    location: z.string().trim().min(5, "Enter the target location."),
    beneficiaries: z.number().int().min(1, "Enter at least one beneficiary."),
    beneficiarySectors: z.array(z.string()).min(1, "Choose at least one beneficiary sector."),
    projectType: z.string().min(1, "Choose a project type."),
    budget: z.number().min(1, "Enter a proposed budget."),
    targetStart: z.string().min(1, "Choose a target start date."),
    targetCompletion: z.string().min(1, "Choose a target completion date."),
    multiYear: z.boolean(),
    cdpReference: z.string().trim().min(3, "Enter the CDP reference."),
    ldipReference: z.string().trim().min(3, "Enter the LDIP reference."),
    aipReference: z.string().trim().min(3, "Enter the AIP reference."),
    primaryFundingSource: z.string().min(1, "Choose a primary fund source."),
    primaryShare: z.number().min(1).max(100),
    secondaryFundingSource: z.string(),
    tags: z.array(z.string()).min(1, "Choose at least one thematic tag."),
  })
  .superRefine((value, context) => {
    if (value.targetStart && value.targetCompletion && value.targetCompletion < value.targetStart) {
      context.addIssue({
        code: "custom",
        path: ["targetCompletion"],
        message: "Completion must be on or after the target start date.",
      });
    }
    if (value.primaryShare < 100 && !value.secondaryFundingSource) {
      context.addIssue({
        code: "custom",
        path: ["secondaryFundingSource"],
        message: "Choose a co-funding source for the remaining share.",
      });
    }
    if (value.secondaryFundingSource && value.secondaryFundingSource === value.primaryFundingSource) {
      context.addIssue({
        code: "custom",
        path: ["secondaryFundingSource"],
        message: "Choose a different co-funding source.",
      });
    }
  });

export type ProposalFormValues = z.infer<typeof proposalSchema>;
