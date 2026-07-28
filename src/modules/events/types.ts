export type FamilyEvent = {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  location?: string;
};

export type EventsConfig = {
  events: FamilyEvent[];
};
