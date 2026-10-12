/* Gas-path stations and the C-MAPSS channels that observe them (Saxena et al., 2008, Table 2).
   Channel mnemonics are a literature mapping; the dataset itself ships unlabeled columns. */

export interface Station {
  id: string;
  name: string;
  short: string;
  sensors: string[];
}

export const STATIONS: Station[] = [
  { id: 'fan', name: 'Fan and bypass duct', short: 'Fan', sensors: ['sensor_8', 'sensor_13', 'sensor_6', 'sensor_15'] },
  { id: 'lpc', name: 'Low-pressure compressor', short: 'LPC', sensors: ['sensor_2'] },
  { id: 'hpc', name: 'High-pressure compressor', short: 'HPC', sensors: ['sensor_3', 'sensor_7', 'sensor_11', 'sensor_9', 'sensor_14'] },
  { id: 'burner', name: 'Combustor', short: 'Burner', sensors: ['sensor_12', 'sensor_16'] },
  { id: 'hpt', name: 'High-pressure turbine', short: 'HPT', sensors: ['sensor_20'] },
  { id: 'lpt', name: 'Low-pressure turbine', short: 'LPT', sensors: ['sensor_4', 'sensor_21'] },
];

export const channelLabel = (key: string) => `Sensor ${key.split('_')[1]}`;

/** Sentence-case a description without lowercasing acronyms (HPC, LPT ...). */
export const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
