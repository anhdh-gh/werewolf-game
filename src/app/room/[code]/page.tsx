import { RoomLobby } from "@/components/RoomLobby";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RoomLobby code={code} />;
}
