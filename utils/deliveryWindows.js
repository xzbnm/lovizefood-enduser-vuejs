// Turns a day's list of allowed delivery times ("11:00", "11:30", ... as sent by
// the API) into the opening windows of that day and the 15-minute choices inside
// each window.
//
// The API sends no opening hours, only the times it accepts, so the windows are
// read off the list: times at most MAX_GAP minutes apart belong to one window.
// A day with a lunch and a dinner service therefore yields two windows, and a
// day with different hours simply yields different ones.

export const STEP_MIN = 15;
const MAX_GAP_MIN = 30;

export function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * @param {string[]} times  allowed times for one day, e.g. ["11:00","11:30",...]
 * @returns {Array<{from:string,to:string,slots:string[]}>}
 */
export function buildWindows(times) {
  const mins = (times || [])
    .map(toMinutes)
    .filter((v) => v !== null)
    .sort((a, b) => a - b);
  if (!mins.length) return [];

  const runs = [];
  let run = [mins[0], mins[0]];
  for (let i = 1; i < mins.length; i++) {
    if (mins[i] - run[1] <= MAX_GAP_MIN) run[1] = mins[i];
    else { runs.push(run); run = [mins[i], mins[i]]; }
  }
  runs.push(run);

  return runs.map(([from, to]) => {
    const slots = [];
    for (let t = from; t <= to; t += STEP_MIN) slots.push(toHHMM(t));
    return { from: toHHMM(from), to: toHHMM(to), slots };
  });
}
