export interface LogResponse {
  logs: {
    [key: string]: {
      holidays?: string[];
      birthdays?: number;
    };
  };
  statistic?: {
    workedOut: string;
    toBeWorkedOut: string | null;
    overtime: string | null;
  } | null;
}
