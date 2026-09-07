import generatedData from './routes.generated.json';
import type { ScheduleDataset } from './types';

export const scheduleData = generatedData as ScheduleDataset;
export const routes = scheduleData.routes;
export const serviceAssumption = scheduleData.serviceAssumption;
export const parseWarnings = scheduleData.warnings;
