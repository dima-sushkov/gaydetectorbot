"use strict";
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");
const { OpenAI } = require("openai");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...((process.env.DATABASE_URL || "").includes(".railway.internal") ? {} : { ssl: { rejectUnauthorized: false } })
});

async function initDb() {
    await pool.query(`CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY, discord_guild_id TEXT, discord_user_id TEXT,
        discord_user_name TEXT, score INTEGER DEFAULT 0, excluded INTEGER DEFAULT 0
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY, discord_guild_id TEXT,
        winner_participant_id INTEGER, datetime INTEGER
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS year_winners (
        id SERIAL PRIMARY KEY, discord_guild_id TEXT, discord_user_id TEXT,
        discord_user_name TEXT, year INTEGER, score INTEGER, datetime INTEGER
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS guild_settings (
        id SERIAL PRIMARY KEY, discord_guild_id TEXT UNIQUE,
        auto_channel_id TEXT, auto_time TEXT DEFAULT '23:59'
    )`);
    console.log("База данных готова");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Системный промт — личность бота
const SYSTEM_PROMPT = `Ты — GayDetector 2.0, дерзкий Discord бот для группы близких друзей.
Ты общаешься грубовато и по-свойски, как в тесной компании где все друг друга знают.
Можешь материться и использовать слово "пидор" — это внутри-шуточный термин комьюнити, никого не обижает.
Ты знаешь свои команды: !пидордня (регистрация), !ктопидор (пробивка), !топпидоров (статистика), !пидоргода (итоги года).
Отвечай коротко, дерзко, с юмором. Не будь вежливым корпоративным ботом.
Если спрашивают не по теме — можешь ответить саркастично но помоги.
Максимум 2-3 предложения в ответе.`;

// История диалогов по серверам (хранится в памяти)
const conversationHistory = new Map();
const ChatFunctions = require("./src/ChatFunctions");
const GamesRepository = require("./src/Repositories/GamesRepository");
const ParticipantRepository = require("./src/Repositories/ParticipantRepository");
const Game = require("./src/Game");
const DbAdapter = require("./src/DbAdapter");

const dbAdapter = new DbAdapter();
const gamesRepository = new GamesRepository(dbAdapter);
const participantsRepository = new ParticipantRepository(dbAdapter);
const game = new Game(dbAdapter, participantsRepository, gamesRepository);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Лок для предотвращения двойного запуска
const activeGames = new Set();

client.once("clientReady", async (c) => {
    await initDb();
    console.log(`Бот запущен как ${c.user.tag}`);
    console.log(`Подключён к ${c.guilds.cache.size} серверам`);
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    console.log(`[MSG] ${msg.guild?.name} | ${msg.author.username}: ${msg.content}`);

    // Ответ на тег бота через OpenAI
    if (msg.mentions.users.has(client.user.id) && !msg.content.startsWith("!")) {
        if (!process.env.OPENAI_API_KEY) {
            msg.channel.send(game.GetMentionReply());
            return;
        }

        const userText = msg.content.replace(/<@!?\d+>/g, "").trim();
        if (!userText) {
            msg.channel.send(game.GetMentionReply());
            return;
        }

        const historyKey = `${msg.guild.id}_${msg.author.id}`;
        if (!conversationHistory.has(historyKey)) {
            conversationHistory.set(historyKey, []);
        }
        const history = conversationHistory.get(historyKey);
        history.push({ role: "user", content: `${msg.member?.displayName || msg.author.username}: ${userText}` });

        // Держим только последние 10 сообщений
        if (history.length > 10) history.splice(0, history.length - 10);

        try {
            await msg.channel.sendTyping();
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...history
                ],
                max_tokens: 150,
                temperature: 0.9,
            });
            const reply = response.choices[0].message.content;
            history.push({ role: "assistant", content: reply });
            msg.channel.send(reply);
        } catch (err) {
            console.error("[OpenAI]", err.message);
            msg.channel.send(game.GetMentionReply());
        }
        return;
    }

    // Регистрация участника
    if (msg.content.match(/^!пидордня/) || msg.content.match(/^!пидорня/)) {
        const isExists = await participantsRepository.IsParticipantExists(msg.author.id, msg.guild.id);
        if (isExists) {
            msg.channel.send("Ты уже участвуешь в игре, дурачок 🙃");
        } else {
            await participantsRepository.AddParticipant(
                msg.author.id,
                msg.guild.id,
                ChatFunctions.getNickname(msg)
            );
            msg.channel.send(`Окей, ты в игре, ${ChatFunctions.getNickname(msg)} 🎲`);
        }
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }

    // Запуск пробивки
    if (msg.content.match(/^!ктопидор/)) {
        ChatFunctions.deleteMessage(msg, 5000);

        if (activeGames.has(msg.guild.id)) {
            msg.channel.send("Пробивка уже идёт, подожди! 🔍");
            return;
        }

        const participant = await participantsRepository.GetRandomParticipant(msg.guild.id);
        if (!participant) {
            msg.channel.send("Нет участников! Сначала зарегистрируйтесь командой !пидордня 🎲");
            return;
        }

        try {
            await game.CanStartGame(msg.guild.id);
        } catch (alreadyWinner) {
            msg.channel.send(`А пидор сегодня уже был — **${alreadyWinner}** 😏`);
            return;
        }

        activeGames.add(msg.guild.id);
        try {
            await game.Tease(msg.channel, false);
            const winMsg = await game.Run(msg.guild.id);
            msg.channel.send(winMsg);
        } catch (err) {
            msg.channel.send(err);
        } finally {
            activeGames.delete(msg.guild.id);
        }
        return;
    }

    // Статистика
    if (msg.content.match(/^!топпидоров/)) {
        const message = await game.GetStats(msg.guild.id);
        msg.channel.send(message);
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }

    // Архив пидора конкретного года — !пидоргода2024 и тд
    const archiveMatch = msg.content.match(/^!пидоргода(\d{4})$/);
    if (archiveMatch) {
        ChatFunctions.deleteMessage(msg, 5000);
        const year = parseInt(archiveMatch[1]);
        const archivePhrases = [
            [`🗂️ Поднимаю архивы ${year} года...`, `Пыль, паутина, запах старых грехов...`, `Нашёл. Вот он, позор того года:`],
            [`📼 Перематываю плёнку в ${year} год...`, `Да, были времена. Кто-то очень старался.`, `Вот кто прославился навсегда:`],
            [`🔍 Пробивка по архиву ${year} года...`, `Запись найдена. Не удалена. Никогда не будет удалена.`, `Итак, легенда ${year} года:`],
        ];
        const set = archivePhrases[Math.floor(Math.random() * archivePhrases.length)];
        for (const p of set) {
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
            msg.channel.send(p);
        }
        await new Promise(r => setTimeout(r, 2000));
        const winner = await game.GetYearWinnerFromArchive(msg.guild.id, year);
        if (!winner) {
            msg.channel.send(`📭 Записей о пидоре ${year} года нет. Либо не играли, либо история не сохранилась.`);
        } else {
            msg.channel.send(`🏆 **Пидор ${year} года** — <@${winner.discord_user_id}> с результатом **${winner.score}** пробивок. Имя вписано в историю навсегда.`);
        }
        return;
    }

    // Пидор года (ручной)
    if (msg.content.match(/^!пидоргода$/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        const now = new Date();
        const currentYear = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const alreadyDone = await game.IsYearWinnerDeclared(msg.guild.id, currentYear);
        if (alreadyDone) {
            msg.channel.send(`✅ Пидор **${currentYear}** года уже объявлен. Следующая пробивка — 31 декабря ${currentYear + 1}. Иди играй.`);
            return;
        }

        if (!(month === 12 && day >= 31)) {
            const targetDate = new Date(currentYear, 11, 31);
            const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
            const earlyPhrases = [
                `🙄 Куда торопишься? До годовой пробивки **${currentYear}** ещё **${daysLeft}** дней. Иди играй дальше.`,
                `📅 Рано, дорогой. Годовая пробивка запускается 31 декабря. Осталось **${daysLeft}** дней.`,
                `😂 Год ещё не кончился! Осталось **${daysLeft}** дней. Может ещё кто-то тебя обгонит.`,
                `🏆 Корона пидора **${currentYear}** года вручается 31 декабря. До пробивки **${daysLeft}** дней. Не спеши.`,
                `⏳ **${daysLeft}** дней до итогов. Расслабься. Никуда твой титул не денется.`,
                `📊 База заблокирована до 31.12.${currentYear}. Осталось **${daysLeft}** дней позора. Продолжай в том же духе.`,
            ];
            msg.channel.send(earlyPhrases[Math.floor(Math.random() * earlyPhrases.length)]);
            return;
        }

        try {
            await game.TeaseYear(msg.channel, false);
            const result = await game.GetYearWinner(msg.guild.id);
            await msg.channel.send(result.announcement);
            await new Promise(r => setTimeout(r, 2000));
            await msg.channel.send(result.congrats);
            await game.SaveYearWinnerAndReset(msg.guild.id, result.userId, result.name, result.score, currentYear);
            await new Promise(r => setTimeout(r, 3000));
            msg.channel.send(`🗓️ Статистика обнулена. Новый год — новая пробивка. Следующая церемония — 31 декабря ${currentYear + 1}.`);
        } catch (err) {
            msg.channel.send(err);
        }
        return;
    }

    // Сброс статистики
    if (msg.content.match(/^!сброспидоров/)) {
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор может сбрасывать статистику! 🚫");
            ChatFunctions.deleteMessage(msg, 2000);
            return;
        }
        msg.channel.send("⚠️ Ты уверен? Это сотрёт **всю** статистику! Напиши `!подтвердить` в течение 15 секунд.");
        ChatFunctions.deleteMessage(msg, 1000);
        try {
            const filter = (m) => m.author.id === msg.author.id && m.content === "!подтвердить";
            const collected = await msg.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ["time"] });
            ChatFunctions.deleteMessage(collected.first(), 500);
            await game.ResetScores(msg.guild.id);
            msg.channel.send("✅ Статистика обнулена! Новая пробивка — новые пидоры 🗑️");
        } catch {
            msg.channel.send("Сброс отменён — время вышло ⏱️");
        }
        return;
    }

    // Исключить участника
    if (msg.content.match(/^!исключить/)) {
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Ты кто такой? Иди отсюда! 🚫");
            ChatFunctions.deleteMessage(msg, 3000);
            return;
        }
        const mentioned = msg.mentions.users.first();
        if (!mentioned) {
            msg.channel.send("Укажи пользователя через @mention");
            ChatFunctions.deleteMessage(msg, 3000);
            return;
        }
        await participantsRepository.RemoveParticipant(mentioned.id, msg.guild.id);
        msg.channel.send(`Пользователь ${mentioned.username} исключён из пробивки`);
        ChatFunctions.deleteMessage(msg, 3000);
        return;
    }

    // Установить канал для авторулетки
    if (msg.content.match(/^!setканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор может настраивать канал! 🚫");
            return;
        }
        await game.SetAutoChannel(msg.guild.id, msg.channel.id);
        msg.channel.send(`✅ Автопробивка будет запускаться в этом канале каждый день в **23:59 UTC** если никто не запустил вручную.`);
        return;
    }

    // Удалить канал авторулетки
    if (msg.content.match(/^!delканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор может удалять настройки! 🚫");
            return;
        }
        await game.RemoveAutoChannel(msg.guild.id);
        msg.channel.send("✅ Автопробивка отключена. Используй `!setканал` чтобы включить снова.");
        return;
    }

    // Сброс и повторная настройка
    if (msg.content.match(/^!resetканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор! 🚫");
            return;
        }
        await game.ResetAutoSettings(msg.guild.id, msg.channel.id);
        msg.channel.send(`✅ Настройки автопробивки сброшены. Канал установлен на этот. Запуск — каждый день в **23:59 UTC**.`);
        return;
    }

    // Инфо об авторулетке
    if (msg.content.match(/^!autoинфо/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        const settings = await game.GetAutoSettings(msg.guild.id);
        if (!settings || !settings.auto_channel_id) {
            msg.channel.send("⚙️ Автопробивка не настроена. Используй `!setканал` в нужном канале.");
        } else {
            msg.channel.send(`⚙️ Автопробивка: канал <#${settings.auto_channel_id}>, запуск в **23:59 UTC** если никто не сыграл вручную.`);
        }
        return;
    }

    // Помощь
    if (msg.content.match(/^!пидорхелп/)) {
        const help = [
            "**🔍 Команды бота:**",
            "`!пидордня` — записаться в участники",
            "`!ктопидор` — запустить пробивку (1 раз в сутки)",
            "`!топпидоров` — топ-10 за всё время",
            "`!пидоргода` — объявить пидора года (31 декабря)",
            "`!пидоргода2026` — архив пидора конкретного года",
            "`!сброспидоров` — обнулить статистику (только для админов)",
            "`!исключить @user` — исключить участника (только для админов)",
            "`!setканал` — установить канал для автопробивки (только для админов)",
            "`!delканал` — отключить автопробивку (только для админов)",
            "`!autoинфо` — показать настройки автопробивки",
        ].join("\n");
        msg.channel.send(help);
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }
});

// CRON — каждую минуту проверяем время
setInterval(async () => {
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const currentDay = now.getUTCDate();
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    // Авто пидор года — 31 декабря в 23:59 UTC
    if (currentTime === "23:59" && currentMonth === 12 && currentDay === 31) {
        console.log("[CRON] Запускаю автопидора года");
        const guilds = await game.GetAllAutoSettings();
        for (const settings of guilds) {
            if (!settings.auto_channel_id) continue;
            const channel = client.channels.cache.get(settings.auto_channel_id);
            if (!channel) continue;
            const guild_id = settings.discord_guild_id;
            const alreadyDone = await game.IsYearWinnerDeclared(guild_id, currentYear);
            if (alreadyDone) continue;
            try {
                await game.TeaseYear(channel, true);
                const result = await game.GetYearWinner(guild_id);
                await channel.send(result.announcement);
                await new Promise(r => setTimeout(r, 2000));
                await channel.send(result.congrats);
                await game.SaveYearWinnerAndReset(guild_id, result.userId, result.name, result.score, currentYear);
                await new Promise(r => setTimeout(r, 3000));
                channel.send(`🗓️ Статистика обнулена. Новый год — новая пробивка. Следующая церемония — 31 декабря ${currentYear + 1}.`);
            } catch (err) {
                console.error(`[CRON] Ошибка автопидора года: ${err}`);
            }
        }
        return;
    }

    // Авто пробивка — 23:59 UTC каждый день
    if (currentTime !== "23:59") return;

    console.log("[CRON] Проверка автопробивки 23:59 UTC");
    const guilds = await game.GetAllAutoSettings();
    console.log(`[CRON] Серверов с автопробивкой: ${guilds.length}`);

    for (const settings of guilds) {
        if (!settings.auto_channel_id) continue;
        const channel = client.channels.cache.get(settings.auto_channel_id);
        if (!channel) continue;
        const guild_id = settings.discord_guild_id;

        const participant = await participantsRepository.GetRandomParticipant(guild_id);
        if (!participant) {
            console.log(`[CRON] Нет участников на сервере ${guild_id}`);
            continue;
        }

        try {
            await game.CanStartGame(guild_id);
        } catch {
            console.log(`[CRON] На сервере ${guild_id} уже играли сегодня`);
            continue;
        }

        if (activeGames.has(guild_id)) continue;
        activeGames.add(guild_id);
        try {
            await game.Tease(channel, true);
            const winMsg = await game.Run(guild_id);
            channel.send(winMsg);
            console.log(`[CRON] Автопробивка запущена на сервере ${guild_id}`);
        } catch (err) {
            console.error(`[CRON] Ошибка автопробивки: ${err}`);
        } finally {
            activeGames.delete(guild_id);
        }
    }
}, 60000);

client.login(process.env.BOT_TOKEN).then(() => {
    console.log("Бот успешно вошёл в систему!");
});
