module.exports = {
    temporaryMessage(channel, text, lifespan = 10000) {
        channel.send(text).then((m) => {
            setTimeout(() => m.delete().catch(() => {}), lifespan);
        });
    },

    getNickname(msg) {
        if (!msg.member) {
            return msg.author.username;
        }
        return msg.member.displayName || msg.author.username;
    },

    deleteMessage(msg, time = 1000) {
        setTimeout(() => {
            msg.delete().catch(() => {});
        }, time);
    },
};
