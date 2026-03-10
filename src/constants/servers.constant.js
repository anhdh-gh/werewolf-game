const SERVERS = [
    {
        id: 'EARTH',
        index: 1,
        name: "Trái Đất",
        api: 'https://werewolf-s1.anhdh.net',
        ws: 'wss://werewolf-s1.anhdh.net'
    },
    {
        id: 'MARS',
        index: 2,
        name: "Sao hỏa",
        api: 'https://werewolf-s2.anhdh.net',
        ws: 'wss://werewolf-s2.anhdh.net'
    },
    {
        id: "LOCAL",
        index: 3,
        name: "Local",
        api: "http://127.0.0.1:3000",
        ws: "ws://127.0.0.1:3000",
    },
];

module.exports = {
    SERVERS
};
