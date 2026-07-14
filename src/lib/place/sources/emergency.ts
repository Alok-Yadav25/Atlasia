interface EmergencyNumbers {
  police: string | null;
  ambulance: string | null;
  fire: string | null;
  general: string | null;
  note: string;
}

const emergencyByCountry: Record<string, Omit<EmergencyNumbers, "note">> = {
  AU: { police: "000", ambulance: "000", fire: "000", general: "000" },
  BR: { police: "190", ambulance: "192", fire: "193", general: null },
  CA: { police: "911", ambulance: "911", fire: "911", general: "911" },
  CN: { police: "110", ambulance: "120", fire: "119", general: null },
  DE: { police: "110", ambulance: "112", fire: "112", general: "112" },
  ES: { police: "112", ambulance: "112", fire: "112", general: "112" },
  FR: { police: "17", ambulance: "15", fire: "18", general: "112" },
  GB: { police: "999", ambulance: "999", fire: "999", general: "112 / 999" },
  GR: { police: "100", ambulance: "166", fire: "199", general: "112" },
  ID: { police: "110", ambulance: "118 / 119", fire: "113", general: "112" },
  IE: { police: "112 / 999", ambulance: "112 / 999", fire: "112 / 999", general: "112 / 999" },
  IN: { police: "112", ambulance: "112", fire: "112", general: "112" },
  IT: { police: "112", ambulance: "118", fire: "115", general: "112" },
  JP: { police: "110", ambulance: "119", fire: "119", general: null },
  KR: { police: "112", ambulance: "119", fire: "119", general: null },
  MX: { police: "911", ambulance: "911", fire: "911", general: "911" },
  MY: { police: "999", ambulance: "999", fire: "999", general: "999" },
  NL: { police: "112", ambulance: "112", fire: "112", general: "112" },
  NZ: { police: "111", ambulance: "111", fire: "111", general: "111" },
  PH: { police: "911", ambulance: "911", fire: "911", general: "911" },
  PT: { police: "112", ambulance: "112", fire: "112", general: "112" },
  SG: { police: "999", ambulance: "995", fire: "995", general: null },
  TH: { police: "191", ambulance: "1669", fire: "199", general: null },
  TR: { police: "112", ambulance: "112", fire: "112", general: "112" },
  US: { police: "911", ambulance: "911", fire: "911", general: "911" },
  VN: { police: "113", ambulance: "115", fire: "114", general: null },
  ZA: { police: "10111", ambulance: "10177", fire: "10177", general: "112 (mobile)" },
};

export function emergencyNumbers(countryCode: string): EmergencyNumbers {
  const numbers = emergencyByCountry[countryCode.toUpperCase()];
  if (!numbers) {
    return {
      police: null,
      ambulance: null,
      fire: null,
      general: null,
      note: "Emergency numbers vary by country and region. Verify the official number before travel; do not rely on this page during an active emergency.",
    };
  }
  return {
    ...numbers,
    note: "Numbers are a travel reference only. Confirm locally and use official emergency services during an active emergency.",
  };
}
