import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Vercel cron auth
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Quarter end dates: Mar 31, Jun 30, Sep 30, Dec 31
  // Send reminder 5 days before → Mar 26, Jun 25, Sep 25, Dec 26
  const reminderDays: Array<{ month: number; day: number; quarter: string }> = [
    { month: 3, day: 26, quarter: "Q1" },
    { month: 6, day: 25, quarter: "Q2" },
    { month: 9, day: 25, quarter: "Q3" },
    { month: 12, day: 26, quarter: "Q4" },
  ];

  const match = reminderDays.find((r) => r.month === month && r.day === day);
  if (!match) {
    return NextResponse.json({ message: "Not a reminder day" });
  }

  const year = now.getFullYear();

  await resend.emails.send({
    from: "Finance App <noreply@yourdomain.com>",
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `Reminder: aggiorna il Net Worth ${match.quarter} ${year}`,
    html: `
      <h2>Aggiornamento trimestrale Net Worth</h2>
      <p>Sono passati quasi 3 mesi — è il momento di aggiornare il tuo Net Worth per <strong>${match.quarter} ${year}</strong>.</p>
      <p>Hai ancora 5 giorni prima della fine del trimestre.</p>
      <a href="${process.env.NEXTAUTH_URL}/net-worth/update"
         style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Aggiorna Net Worth
      </a>
    `,
  });

  return NextResponse.json({ success: true, quarter: `${match.quarter} ${year}` });
}
