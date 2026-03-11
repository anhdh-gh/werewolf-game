"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectVoiceRoom,
  disconnectVoiceRoom,
  setMicrophoneEnabled,
  getLivekitRoom,
} from "@/utils/livekit";

export function useVoiceRoom() {
  const [connectedVoice, setConnectedVoice] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);

  const joinVoiceRoom = useCallback(async ({ url, token }) => {

     console.log("voice url:", url);
  console.log("voice token:", token);

    try {
  const room = await connectVoiceRoom({
    url,
    token,
    onParticipantConnected: (participant) => {
      setParticipants((prev) => {
        const existed = prev.find((p) => p.identity === participant.identity);
        if (existed) return prev;
        return [...prev, participant];
      });
    },
    onParticipantDisconnected: (participant) => {
      setParticipants((prev) =>
        prev.filter((p) => p.identity !== participant.identity)
      );
    },
  });

  setConnectedVoice(true);
  setParticipants(Array.from(room.remoteParticipants.values()));
  return room;
} catch (error) {
  console.error("joinVoiceRoom failed:", error);
  setConnectedVoice(false);
  throw error;
}
  }, []);

  const leaveVoiceRoom = useCallback(async () => {
    await disconnectVoiceRoom();
    setConnectedVoice(false);
    setParticipants([]);
    setMicEnabled(true);
  }, []);

  const toggleMic = useCallback(async () => {
    const nextValue = !micEnabled;
    await setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  }, [micEnabled]);

  useEffect(() => {
    return () => {
      disconnectVoiceRoom();
    };
  }, []);

  return {
    room: getLivekitRoom(),
    connectedVoice,
    micEnabled,
    participants,
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleMic,
  };
}