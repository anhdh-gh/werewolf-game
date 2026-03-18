import { Room } from "livekit-client";

let livekitRoom = null;

function getVoiceCount(room) {
  return room ? room.remoteParticipants.size + 1 : 0;
}

export function getLivekitRoom() {
  return livekitRoom;
}

export async function connectVoiceRoom({
  url,
  token,
  onParticipantConnected,
  onParticipantDisconnected,
  onTrackSubscribed,
}) {
  console.log("A. connectVoiceRoom called");
  console.log("url:", url);
  console.log("token exists:", !!token);

  try {
    if (livekitRoom) {
      console.log("B. disconnect old room");
      await disconnectVoiceRoom();
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    room.on("connectionStateChanged", (state) => {
      console.log("EVENT connectionStateChanged:", state);
    });

    room.on("participantConnected", (participant) => {
      console.log("EVENT participantConnected:", participant.identity);
      console.log("VOICE COUNT:", getVoiceCount(room));
      onParticipantConnected?.(participant);
    });

    room.on("participantDisconnected", (participant) => {
      console.log("EVENT participantDisconnected:", participant.identity);
      console.log("VOICE COUNT:", getVoiceCount(room));
      onParticipantDisconnected?.(participant);
    });

    room.on("trackSubscribed", (track, publication, participant) => {
      console.log("EVENT trackSubscribed:", participant.identity, track.kind);

      if (track.kind === "audio") {
        const element = track.attach();
        element.autoplay = true;
        element.setAttribute("data-participant-id", participant.identity);

        const container = document.getElementById("livekit-audio-container");
        if (container) {
          container.appendChild(element);
        }
      }

      onTrackSubscribed?.(track, publication, participant);
    });

    room.on("trackUnsubscribed", (track, publication, participant) => {
      console.log("EVENT trackUnsubscribed:", participant.identity, track.kind);

      if (track.kind === "audio") {
        track.detach().forEach((el) => el.remove());
      }
    });

    room.on("disconnected", (reason) => {
      console.log("EVENT disconnected:", reason);
    });

    room.on("reconnecting", () => {
      console.log("EVENT reconnecting");
    });

    room.on("reconnected", () => {
      console.log("EVENT reconnected");
    });

    room.on("mediaDevicesError", (error) => {
      console.error("EVENT mediaDevicesError:", error);
    });

    console.log("C. before room.connect");
    await room.connect(url, token);
    console.log("D. after room.connect");

    console.log("VOICE COUNT after connect:", getVoiceCount(room));

    livekitRoom = room;
    return room;
  } catch (error) {
    console.error("X. connectVoiceRoom FAILED:", error);
    throw error;
  }
}

export async function disconnectVoiceRoom() {
  if (!livekitRoom) return;

  console.log("disconnectVoiceRoom called");

  livekitRoom.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication) => {
      publication.track?.detach?.().forEach((el) => el.remove());
    });
  });

  livekitRoom.localParticipant.trackPublications.forEach((publication) => {
    publication.track?.detach?.().forEach((el) => el.remove());
  });

  livekitRoom.disconnect();
  livekitRoom = null;
}

export async function setMicrophoneEnabled(enabled) {
  if (!livekitRoom) return;
  await livekitRoom.localParticipant.setMicrophoneEnabled(enabled);
}