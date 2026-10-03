export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Rescued', 'Completed', 'Cancelled', 'Rejected'];
export const INJURY_TYPES = ['Wing injury', 'Leg injury', 'Head trauma', 'Entangled', 'Poisoning', 'Exhaustion', 'Orphaned chick', 'Other'];
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const slug = (s = '') => s.toLowerCase().replace(/\s+/g, '-');
export const TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled', 'Rejected'],
  Assigned: ['In Progress', 'Cancelled'],
  'In Progress': ['Rescued', 'Cancelled'],
  Rescued: ['Completed'],
  Completed: [], Cancelled: [], Rejected: [],
};
export const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const CONSERVATION = ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Unknown'];

// Mirrors server/utils/rescueWorkflow.js (the server is the source of truth and re-validates every change).
export const TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled', 'Rejected'],
  Assigned: ['In Progress', 'Pending', 'Cancelled'],
  'In Progress': ['Rescued', 'Cancelled'],
  Rescued: ['Completed'],
  Completed: [],
  Cancelled: [],
  Rejected: [],
};
export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const AVAILABILITY = ['available', 'busy', 'offline'];
