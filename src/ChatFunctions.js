module.exports = {
    // Отправка с анимацией печати и задержкой
    async typingAndSend(channel, text, delay = null) {
        const pause = delay !== null ? delay : 800 + Math.random() * 1200;
        await new Promise(r => setTimeout(r, pause));
        await channel.sendTyping();
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
        return channel.send(text);
    },

    getNickname(msg) {
        if (!msg.member) return msg.author.username;
        return msg.member.displayName || msg.author.username;
    },

    deleteMessage(msg, time = 1000) {
        setTimeout(() => {
            msg.delete().catch(() => {});
        }, time);
    },
};
