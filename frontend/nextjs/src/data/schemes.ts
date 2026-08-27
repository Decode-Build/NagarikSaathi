export interface Scheme {
  id: string;
  name: string;
  overview: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  applicationProcess: string[];
  helpline: string;
  portalUrl: string;
}

export const mockSchemes: Scheme[] = [
  {
    id: "scheme-1",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    overview: "An initiative by the Government of India in which all farmers will get up to ₹6,000 per year as minimum income support.",
    benefits: [
      "Financial benefit of ₹6,000 per year.",
      "Payable in three equal installments of ₹2,000 each.",
      "Direct Benefit Transfer (DBT) into Aadhaar seeded bank accounts."
    ],
    eligibility: [
      "Must be a landholding farmer family.",
      "Must have cultivable land holding.",
      "Small and marginal farmers are eligible."
    ],
    documents: [
      "Aadhaar Card",
      "Bank Passbook",
      "Land Ownership Documents (Khatauni)",
      "Passport Size Photograph"
    ],
    applicationProcess: [
      "Visit the official PM-KISAN portal.",
      "Click on 'New Farmer Registration'.",
      "Enter Aadhaar number and fill the registration form.",
      "Submit the required documents."
    ],
    helpline: "155261 / 011-24300606",
    portalUrl: "https://pmkisan.gov.in"
  },
  {
    id: "scheme-2",
    name: "Ayushman Bharat - PMJAY",
    overview: "A national public health insurance fund of the Government of India that aims to provide free access to health insurance coverage for low income earners in the country.",
    benefits: [
      "Health cover of ₹5 lakhs per family per year.",
      "Cashless and paperless access to services at empaneled hospitals.",
      "Covers pre and post-hospitalization expenses."
    ],
    eligibility: [
      "Families belonging to poor and vulnerable sections.",
      "Identified based on SECC 2011 data.",
      "No restriction on family size, age or gender."
    ],
    documents: [
      "Aadhaar Card",
      "Ration Card",
      "Income Certificate"
    ],
    applicationProcess: [
      "Visit nearest Common Service Centre (CSC) or empaneled hospital.",
      "Provide Aadhaar and Ration card to the Ayushman Mitra.",
      "Complete the e-KYC process.",
      "Receive the Ayushman Golden Card."
    ],
    helpline: "14555",
    portalUrl: "https://pmjay.gov.in"
  }
];
