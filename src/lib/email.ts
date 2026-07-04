const RESEND_API = 'https://api.resend.com/emails';

function row(label: string, value: string) {
  return `<tr>
    <td style="color:#6b7280;font-size:12px;font-weight:700;padding:6px 0;border-bottom:1px solid #f3f4f6;width:44%">${label}</td>
    <td style="color:#111827;font-size:12px;font-weight:600;padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right">${value}</td>
  </tr>`;
}

function shell(title: string, subtitle: string, emoji: string, bodyHtml: string, ctaHref: string, ctaLabel: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
  <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:28px 32px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">${emoji}</div>
    <h1 style="color:white;font-size:18px;font-weight:800;margin:0 0 4px">CoachConnect</h1>
    <p style="color:#bbf7d0;font-size:12px;margin:0">Sports Staffing for Schools</p>
  </div>
  <div style="padding:24px 32px">
    <h2 style="color:#111827;font-size:18px;font-weight:800;margin:0 0 4px">${title}</h2>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px">${subtitle}</p>
    ${bodyHtml}
    <div style="text-align:center;margin-top:24px">
      <a href="${siteUrl}${ctaHref}" style="display:inline-block;background:#16a34a;color:white;font-size:13px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none">
        ${ctaLabel} →
      </a>
    </div>
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 24px;text-align:center">
    <p style="color:#9ca3af;font-size:11px;margin:0">CoachConnect · South Africa · Sports Staffing Platform</p>
  </div>
</div>
</body></html>`;
}

export async function sendApplicationEmail({
  schoolEmail, schoolContactName, coachName, jobTitle, sport, coachMessage, jobId,
}: {
  schoolEmail: string;
  schoolContactName: string;
  coachName: string;
  jobTitle: string;
  sport: string;
  coachMessage?: string | null;
  jobId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const firstName = schoolContactName.split(' ')[0];
  const tableRows = [
    row('Coach', coachName),
    row('Job', jobTitle),
    row('Sport', sport),
    ...(coachMessage ? [row('Message', coachMessage)] : []),
  ].join('');

  const html = shell(
    `New application from ${coachName}`,
    `Hi ${firstName}, a coach has applied to your vacancy.`,
    '📬',
    `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows}</table>`,
    `/school/jobs/${jobId}`,
    'Review application'
  );

  await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'CoachConnect <notifications@coachconnect.co.za>',
      to: [schoolEmail],
      subject: `New application: ${jobTitle}`,
      html,
    }),
  }).catch(console.error);
}

export async function sendAcceptedEmail({
  coachEmail, coachName, schoolName, jobTitle, sport, jobDate,
}: {
  coachEmail: string;
  coachName: string;
  schoolName: string;
  jobTitle: string;
  sport: string;
  jobDate?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const firstName = coachName.split(' ')[0];
  const tableRows = [
    row('School', schoolName),
    row('Job', jobTitle),
    row('Sport', sport),
    ...(jobDate ? [row('Date', new Date(`${jobDate}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))] : []),
  ].join('');

  const html = shell(
    `Congratulations, ${firstName}!`,
    'Your application has been accepted.',
    '🎉',
    `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows}</table>`,
    '/messages',
    'Message the school'
  );

  await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'CoachConnect <notifications@coachconnect.co.za>',
      to: [coachEmail],
      subject: `You got the job — ${jobTitle}`,
      html,
    }),
  }).catch(console.error);
}

export async function sendRejectedEmail({
  coachEmail, coachName, jobTitle,
}: {
  coachEmail: string;
  coachName: string;
  jobTitle: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const firstName = coachName.split(' ')[0];
  const html = shell(
    `Application update`,
    `Hi ${firstName}, thanks for applying.`,
    '📋',
    `<p style="color:#6b7280;font-size:13px">Unfortunately, the school has filled the position for <strong>${jobTitle}</strong>. Keep your profile active — new jobs are posted regularly.</p>`,
    '/jobs',
    'Browse more jobs'
  );

  await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'CoachConnect <notifications@coachconnect.co.za>',
      to: [coachEmail],
      subject: `Application update — ${jobTitle}`,
      html,
    }),
  }).catch(console.error);
}
