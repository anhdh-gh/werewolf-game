const { AccessToken } = require("livekit-server-sdk");

function createVoiceToken(roomId, playerId) {

    console.log("LIVEKIT_API_KEY",process.env.LIVEKIT_API_KEY)
    console.log("LIVEKIT_API_SECRET",process.env.LIVEKIT_API_SECRET)
     console.log("roomId", roomId);
  console.log("playerId", playerId);

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: String(playerId)
        }
    );

    at.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true
    });

    return at.toJwt();
}

module.exports = {
    createVoiceToken
};