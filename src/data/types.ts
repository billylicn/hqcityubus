export type Direction = 'toHengqin' | 'toUniversity';

export type StopRole = 'boarding' | 'alighting' | null;

export interface RouteStop {
  rawName: string;
  displayName: string;
  time: string;
  minutes: number;
  dayOffset: number;
  role: StopRole;
}

export interface RouteService {
  routeCode: string;
  serviceName: string;
  direction: Direction;
  serviceDays: number[];
  validDates: string[] | null;
  serviceRuleSource: string;
  stops: RouteStop[];
  boardingStopIndex: number;
  alightingStopIndex: number;
  boardingTime: string;
  alightingTime: string;
  boardingMinutes: number;
  alightingMinutes: number;
  duration: number;
}

export interface ParseWarning {
  source?: string;
  serviceName?: string;
  line?: number;
  content?: string;
  message: string;
}

export interface ScheduleDataset {
  schemaVersion: number;
  generatedFrom: string[];
  serviceAssumption: string;
  warnings: ParseWarning[];
  routes: RouteService[];
}

export interface ScheduledTrip {
  id: string;
  route: RouteService;
  serviceDateKey: string;
  departure: Date;
}
