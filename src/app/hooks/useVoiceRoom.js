"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectVoiceRoom,
  disconnectVoiceRoom,
  setMicrophoneEnabled,
} from "@/utils/livekit";

export function useVoiceRoom() {
  const [room, setRoom] = useState(null);
  const [connectedVoice, setConnectedVoice] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [participants, setParticipants] = useState([]);

  const joinVoiceRoom = useCallback(async ({ url, token }) => {
    console.log("voice url:", url);
    console.log("voice token:", token);

    try {
      const connectedRoom = await connectVoiceRoom({
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

      setRoom(connectedRoom);
      setConnectedVoice(true);
      setParticipants(Array.from(connectedRoom.remoteParticipants.values()));

      return connectedRoom;
    } catch (error) {
      console.error("joinVoiceRoom failed:", error);
      setRoom(null);
      setConnectedVoice(false);
      setParticipants([]);
      throw error;
    }
  }, []);

  const leaveVoiceRoom = useCallback(async () => {
    await disconnectVoiceRoom();
    setRoom(null);
    setConnectedVoice(false);
    setParticipants([]);
    setMicEnabled(false);
  }, []);

  const toggleMic = useCallback(async () => {
    const nextValue = !micEnabled;
    await setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  }, [micEnabled]);

  useEffect(() => {
    return () => {
      disconnectVoiceRoom().catch(console.error);
    };
  }, []);

  return {
    room,
    connectedVoice,
    micEnabled,
    participants,
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleMic,
  };
}