import type { Metadata } from "next";
import Report, { generateMetadata as publicMetadata } from "@/components/protected-profile/HandleReport";
import { ProtectedProfile } from "@/components/protected-profile/ProtectedProfile";
import { requiresProfileAccount } from "@/lib/profile-access";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ handle: string;  }> };
export async function generateMetadata(props: Props): Promise<Metadata> {
 const { handle } = await props.params;
 if (requiresProfileAccount(handle)) return { title: "Neil Mac’s betting record", description: "Create a free account or sign in to view this betting record.", robots: { index: false, follow: true }, openGraph: { title: "Neil Mac’s betting record", description: "Sign in to view results.", images: ["/opengraph-image"] }, twitter: { card: "summary_large_image", title: "Neil Mac’s betting record", description: "Sign in to view results.", images: ["/opengraph-image"] } };
 return publicMetadata(props);
}
export default async function Page(props: Props) {
 const params = await props.params;
 if (requiresProfileAccount(params.handle)) return <ProtectedProfile handle={params.handle}  />;
 return <Report {...props} />;
}
