import type { QueueConfig } from "./model";
export interface QueueState {
  tick: number;
  created: number;
  completed: number;
  buffered: number;
  blocked: number;
  running: number;
}
export function simulateQueue(config: QueueConfig): QueueState[] {
  let created = 0,
    completed = 0,
    buffered = 0,
    blocked = 0;
  const workers = Array<number>(config.workers).fill(0);
  const states: QueueState[] = [
    { tick: 0, created, completed, buffered, blocked, running: 0 },
  ];
  for (let tick = 1; completed < config.jobs && tick <= 610; tick++) {
    for (let i = 0; i < workers.length; i++) {
      if (workers[i]! > 0 && --workers[i]! === 0) completed++;
    }
    const arrivals = Math.min(config.arrival, config.jobs - created);
    created += arrivals;
    blocked += arrivals;
    for (let i = 0; i < workers.length; i++) {
      if (workers[i] !== 0) continue;
      if (buffered > 0) buffered--;
      else if (blocked > 0) blocked--;
      else continue;
      workers[i] = config.service;
    }
    const admitted = Math.min(blocked, config.capacity - buffered);
    buffered += admitted;
    blocked -= admitted;
    states.push({
      tick,
      created,
      completed,
      buffered,
      blocked,
      running: workers.filter((n) => n > 0).length,
    });
  }
  return states;
}
