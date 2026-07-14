// ---------------------------------------------------------------------------
// LinkedIn Sales Navigator school facet IDs (numeric org ids).
// Without an id, the SCHOOL filter in a URL usually does not pre-select in UI.
// ---------------------------------------------------------------------------

import { normalizeTerm } from "./query-builder";

/** Normalized school name -> LinkedIn school id. */
export const LINKEDIN_SCHOOL_IDS: Record<string, string> = {
  [normalizeTerm("Stanford University")]: "1792",
  [normalizeTerm("MIT")]: "1503",
  [normalizeTerm("Carnegie Mellon University")]: "3147",
  [normalizeTerm("UC Berkeley")]: "2517",
  [normalizeTerm("University of California, Berkeley")]: "2517",
  [normalizeTerm("University of California Berkeley")]: "2517",
  [normalizeTerm("Georgia Tech")]: "18159",
  [normalizeTerm("Georgia Institute of Technology")]: "18159",
  [normalizeTerm("University of Waterloo")]: "166688",
  [normalizeTerm("IIT Bombay")]: "157266",
  [normalizeTerm("Indian Institute of Technology Bombay")]: "157266",
  [normalizeTerm("IIT Delhi")]: "157264",
  [normalizeTerm("Indian Institute of Technology Delhi")]: "157264",
  [normalizeTerm("University of Oxford")]: "4477",
  [normalizeTerm("University of Cambridge")]: "4522",
  [normalizeTerm("University of Toronto")]: "3660",
  [normalizeTerm("ETH Zurich")]: "5106",
  [normalizeTerm("Harvard University")]: "1646",
};

export function lookupLinkedInSchoolId(school: string): string | undefined {
  const key = normalizeTerm(school);
  return LINKEDIN_SCHOOL_IDS[key];
}
