export async function sendSubmissionEmail(submission: {
  id: string;
  projectName: string;
  url: string;
  category: string;
  description?: string | null;
  verified: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QINDEX_ADMIN_EMAIL;
  const from = process.env.QINDEX_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    return { sent: false, reason: "Email environment variables are not configured." };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
      <h2>New QIndex submission</h2>
      <p><strong>${escapeHtml(submission.projectName)}</strong> has been submitted for review.</p>
      <p><strong>URL:</strong> <a href="${escapeAttr(submission.url)}">${escapeHtml(submission.url)}</a></p>
      <p><strong>Category:</strong> ${escapeHtml(submission.category)}</p>
      <p><strong>Technical verification:</strong> ${submission.verified ? "QStorage signal detected" : "Not verified as QStorage"}</p>
      <p><a href="${escapeAttr(base + "/admin")}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none">Review in QIndex Admin →</a></p>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New QIndex submission — ${submission.projectName}`,
      html,
    }),
  });

  if (!response.ok) return { sent: false, reason: await response.text() };
  return { sent: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] || char));
}
function escapeAttr(value: string) {
  return escapeHtml(value);
}
