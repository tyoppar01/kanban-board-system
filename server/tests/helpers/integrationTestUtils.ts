import { execSync } from 'child_process';

/**
 * Check if Docker is available on the system
 * @returns true if Docker is running, false otherwise
 */
export function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Conditional describe that only runs if Docker is available
 * Automatically skips tests if Docker is not running
 */
export const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

/**
 * Create a date in the future
 * @param days - Number of days in the future
 * @returns Date object
 */
export function futureDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Create a date in the past
 * @param milliseconds - Number of milliseconds in the past
 * @returns Date object
 */
export function pastDate(milliseconds: number): Date {
  return new Date(Date.now() - milliseconds);
}
