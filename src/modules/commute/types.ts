export type CommutePersonConfig = {
  id: string;
  name: string;
  destLabel: string;
  destLat: number;
  destLon: number;
  color: string;
  /** Local work start time HH:mm */
  workStart?: string;
  /** Minutes before arrival to leave early */
  bufferMinutes?: number;
};

export type CommuteConfig = {
  homeLabel: string;
  homeLat: number;
  homeLon: number;
  refreshMinutes: number;
  people: CommutePersonConfig[];
};
