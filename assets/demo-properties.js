// Curated snapshots of individual certificates on the public GOV.UK EPC register.
// These are NOT an EPC search API. Never attach one of these records to a
// different postcode, address or fictional household without clear labelling.
export const demoProperties = [
  {
    id: "new-road-15",
    postcode: "HX7 8AD",
    address: "15 New Road, Hebden Bridge",
    type: "Semi-detached house",
    floorArea: 128,
    epc: "D",
    epcScore: 61,
    potentialEpc: "B",
    potentialScore: 84,
    validUntil: "11 August 2030",
    assessmentDate: "4 August 2020",
    wall: "Stone walls, no insulation (assumed)",
    roof: "Pitched roof, 300 mm loft insulation",
    recommendations: ["wall"],
    certificate: "https://find-energy-certificate.service.gov.uk/energy-certificate/0548-9018-7278-7310-4210",
  },
  {
    id: "new-road-2",
    postcode: "HX7 8AD",
    address: "2 New Road, Hebden Bridge",
    type: "Detached house",
    floorArea: 99,
    epc: "E",
    epcScore: 49,
    potentialEpc: "B",
    potentialScore: 81,
    validUntil: "25 April 2031",
    assessmentDate: "25 April 2021",
    wall: "Solid brick walls, no insulation (assumed)",
    roof: "Pitched roof, no insulation (assumed)",
    recommendations: ["roof", "wall"],
    certificate: "https://find-energy-certificate.service.gov.uk/energy-certificate/0319-9124-4000-0355-5226",
  },
  {
    id: "new-road-18",
    postcode: "HX7 8AD",
    address: "18 New Road, Hebden Bridge",
    type: "Top-floor flat",
    floorArea: 65,
    epc: "C",
    epcScore: 80,
    potentialEpc: "C",
    potentialScore: 80,
    validUntil: "9 August 2036",
    assessmentDate: "8 June 2026",
    wall: "Stone walls, internal insulation",
    roof: "Pitched roof, 300 mm loft insulation",
    recommendations: [],
    certificate: "https://find-energy-certificate.service.gov.uk/energy-certificate/0330-2248-4660-2306-2581",
  },
];

export function propertiesForPostcode(postcode) {
  return demoProperties.filter(property => property.postcode === postcode);
}

// Postcode counts show area exposure, not the risk of any chosen property.
// A survey is therefore recommended before considering physical flood works.
export function evidenceRecommendations(record, property) {
  const recommendations = [];
  if (record && record.high + record.medium + record.low > 0) {
    recommendations.push("survey", "warning");
  }
  if (property) recommendations.push(...property.recommendations);
  return [...new Set(recommendations)];
}
