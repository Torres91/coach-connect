export function formatZAR(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

export function generateSessionDates(
  startDate: string,
  endDate: string,
  daysOfWeek: string[],
): string[] {
  const dates: string[] = [];
  const end = new Date(`${endDate}T12:00:00`);
  const targets = daysOfWeek.map(d => DAY_INDEX[d]).filter(n => n !== undefined);
  const cur = new Date(`${startDate}T12:00:00`);
  while (cur <= end) {
    if (targets.includes(cur.getDay())) {
      dates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function calcMatchScore(
  coach: { sports: string[]; experience_years: number; available_days?: string[] | null },
  job: { sport: string; days_of_week?: string[] | null; req_experience_years?: number | null },
): number {
  let score = 0;
  if (coach.sports.includes(job.sport)) score += 40;
  const required = job.days_of_week ?? [];
  if (required.length > 0 && coach.available_days && coach.available_days.length > 0) {
    const allMatch = required.every(d => coach.available_days!.includes(d));
    if (allMatch) score += 40;
    else {
      const matched = required.filter(d => coach.available_days!.includes(d)).length;
      score += Math.round((matched / required.length) * 20);
    }
  } else {
    score += 20; // no schedule info, give partial credit
  }
  const reqYears = job.req_experience_years ?? 0;
  if (coach.experience_years >= reqYears) score += 20;
  else if (reqYears > 0) score += Math.round((coach.experience_years / reqYears) * 10);
  return Math.min(score, 100);
}
