import Link from "next/link";

export function CreatorPartnerInvite() {
  return (
    <aside className="creator-profile-invite" aria-label="Paid creator partnerships">
      <div><span>Paid creator partnerships</span><strong>Have an audience? Get paid to track.</strong><p>Make Am I Up your primary tracker and share it with your followers. Terms agreed individually.</p></div>
      <Link href="/partners" className="btn-primary">Apply to partner →</Link>
    </aside>
  );
}
