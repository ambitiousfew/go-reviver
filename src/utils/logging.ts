import { LogType } from "../types/log";


export function formatLog(message: string, type: LogType = LogType.INFO): string {
  return `${new Date().toISOString()} [${type}]: ${message}`;
}