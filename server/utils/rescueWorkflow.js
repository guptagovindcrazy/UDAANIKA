// Single source of truth for the rescue lifecycle.
const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Rescued', 'Completed', 'Cancelled', 'Rejected'];

const TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled', 'Rejected'],
  Assigned: ['In Progress', 'Pending', 'Cancelled'], // 'Pending' = released back to the pool
  'In Progress': ['Rescued', 'Cancelled'],
  Rescued: ['Completed'],
  Completed: [],
  Cancelled: [],
  Rejected: [],
};

// Which roles may move a request INTO a given status.
const ROLE_CAN_SET = {
  user: ['Cancelled'],
  volunteer: ['Pending', 'In Progress', 'Rescued', 'Completed', 'Cancelled'],
  admin: STATUSES,
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
const roleCanSet = (role, to) => (ROLE_CAN_SET[role] || []).includes(to);

module.exports = { STATUSES, TRANSITIONS, canTransition, roleCanSet };
