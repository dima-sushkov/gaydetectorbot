"use strict";
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");
const ChatFunctions = require("./src/ChatFunctions");
const GamesRepository = require("./src/Repositories/GamesRepository");
const ParticipantRepository = require("./src/Repositories/ParticipantRepository");
const Game = require("./src/Game");
const DbAdapter = require("./src/DbAdapter");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDb() {
    await pool.query(`CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        score INTEGER DEFAULT 0,
        excluded INTEGER DEFAULT 0
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        discord_guild_id TEXT,
        winner_participant_id INTEGER,
        datetime INTEGER
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS year_winners (
        id SERIAL PRIMARY KEY,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        year INTEGER,
        score INTEGER,
        datetime INTEGER
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS guild_settings (
        id SERIAL PRIMARY KEY,
        discord_guild_id TEXT UNIQUE,
        auto_channel_id TEXT,
        auto_time TEXT DEFAULT '09:00'
    )`);
    console.log("База данных готова");
}

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

// Лок для предотвращения двойного запуска рулетки
const activeGames = new Set();

client.once("clientReady", async (c) => {
    await initDb();
    console.log(`Бот запущен как ${c.user.tag}`);
    console.log(`Подключён к ${c.guilds.cache.size} серверам`);
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    console.log(`[MSG] ${msg.guild?.name} | ${msg.author.username}: ${msg.content}`);

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
        ChatFunctions.deleteMessage(msg, 2000);
        return;
    }

    // Запуск рулетки
    if (msg.content.match(/^!ктопидор/)) {
        ChatFunctions.deleteMessage(msg, 5000);

        // Защита от двойного запуска
        if (activeGames.has(msg.guild.id)) {
            msg.channel.send("Рулетка уже крутится, подожди! 🎰");
            return;
        }

        // Сначала проверяем есть ли участники
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
            await game.Tease(msg.channel);
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
        ChatFunctions.deleteMessage(msg, 1000);
        return;
    }

    // Просмотр архива — !пидоргода2024, !пидоргода2025 и тд
    const archiveMatch = msg.content.match(/^!пидоргода(\d{4})$/);
    if (archiveMatch) {
        ChatFunctions.deleteMessage(msg, 5000);
        const year = parseInt(archiveMatch[1]);

        const archiveTeasePhrases = [
            [`🗂️ Поднимаю архивы ${year} года...`, `Пыль, паутина, запах старых грехов...`, `Нашёл. Вот он, позор того года:`],
            [`📼 Перематываю плёнку в ${year} год...`, `Да, были времена. Кто-то очень старался.`, `Вот кто прославился навсегда:`],
            [`🔍 Ищу в базе данных пидора ${year} года...`, `Запись найдена. Не удалена. Никогда не будет удалена.`, `Итак, легенда ${year} года:`],
        ];
        const archiveTeaseSet = archiveTeasePhrases[Math.floor(Math.random() * archiveTeasePhrases.length)];
        for (const p of archiveTeaseSet) {
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
            msg.channel.send(p);
        }
        await new Promise(r => setTimeout(r, 2000));

        const winner = await game.GetYearWinnerFromArchive(msg.guild.id, year);
        if (!winner) {
            msg.channel.send(`📭 Записей о пидоре ${year} года нет. Либо не играли, либо история не сохранилась.`);
        } else {
            msg.channel.send(`🏆 **Пидор ${year} года** — <@${winner.discord_user_id}> с результатом **${winner.score}** раз. Имя вписано в историю навсегда.`);
        }
        return;
    }

    // Пидор года
    if (msg.content.match(/^!пидоргода$/)) {
        ChatFunctions.deleteMessage(msg, 1000);

        const now = new Date();
        const currentYear = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const isTimeToReveal = month === 12 && day >= 31;

        // Проверяем — объявляли ли уже пидора этого года
        const alreadyDone = await game.IsYearWinnerDeclared(msg.guild.id, currentYear);
        if (alreadyDone) {
            msg.channel.send(`✅ Пидор **${currentYear}** года уже объявлен. Следующая церемония — 31 декабря ${currentYear + 1}. Иди играй.`);
            return;
        }

        if (!isTimeToReveal) {
            const targetDate = new Date(currentYear, 11, 31);
            const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
            const earlyPhrases = [
                `🙄 Куда торопишься? До итогов **${currentYear}** года ещё **${daysLeft}** дней. Иди играй дальше.`,
                `📅 Рано, дорогой. Пидор года объявляется 31 декабря. Осталось **${daysLeft}** дней усердной работы.`,
                `😂 Год ещё не кончился! Осталось **${daysLeft}** дней. Может ещё кто-то тебя обгонит.`,
                `🏆 Корона пидора **${currentYear}** года вручается 31 декабря. До церемонии **${daysLeft}** дней. Не спеши.`,
                `⏳ **${daysLeft}** дней до итогов. Расслабься. Никуда твой титул не денется.`,
                `📊 База данных заблокирована до 31.12.${currentYear}. Осталось **${daysLeft}** дней позора. Продолжай в том же духе.`,
            ];
            msg.channel.send(earlyPhrases[Math.floor(Math.random() * earlyPhrases.length)]);
            return;
        }

        try {
            await game.TeaseYear(msg.channel);
            const result = await game.GetYearWinner(msg.guild.id);
            await msg.channel.send(result.announcement);
            await new Promise(r => setTimeout(r, 2000));
            await msg.channel.send(result.congrats);
            // Сохраняем победителя в архив и сбрасываем статистику
            await game.SaveYearWinnerAndReset(msg.guild.id, result.userId, result.name, result.score, currentYear);
            await new Promise(r => setTimeout(r, 3000));
            msg.channel.send(`🗓️ Статистика обнулена. Новый год — новая борьба. Следующая церемония — 31 декабря ${currentYear + 1}.`);
        } catch (err) {
            msg.channel.send(err);
        }
        return;
    }

    // Сброс статистики (только для администраторов)
    if (msg.content.match(/^!сброспидоров/)) {
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор может сбрасывать статистику! 🚫");
            ChatFunctions.deleteMessage(msg, 2000);
            return;
        }

        // Двойное подтверждение — ждём "да" в течение 15 секунд
        msg.channel.send("⚠️ Ты уверен? Это сотрёт **всю** статистику пидоров! Напиши `!подтвердить` в течение 15 секунд.");
        ChatFunctions.deleteMessage(msg, 1000);

        try {
            const filter = (m) =>
                m.author.id === msg.author.id && m.content === "!подтвердить";
            const collected = await msg.channel.awaitMessages({
                filter,
                max: 1,
                time: 15000,
                errors: ["time"],
            });
            ChatFunctions.deleteMessage(collected.first(), 500);
            const result = await game.ResetScores(msg.guild.id);
            msg.channel.send(result);
        } catch {
            msg.channel.send("Сброс отменён — время вышло ⏱️");
        }
        return;
    }

    // Исключить участника (только для администраторов)
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
        msg.channel.send(`Пользователь ${mentioned.username} исключён из игры`);
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
        msg.channel.send(`✅ Авторулетка будет запускаться в этом канале каждый день. Используй \`!setвремя ЧЧ:ММ\` чтобы указать время (UTC).`);
        return;
    }

    // Изменить время авторулетки
    if (msg.content.match(/^!setвремя/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор может настраивать время! 🚫");
            return;
        }
        const timeMatch = msg.content.match(/^!setвремя\s+(\d{2}:\d{2})$/);
        if (!timeMatch) {
            msg.channel.send("Неверный формат. Используй: `!setвремя 09:00` (время в UTC)");
            return;
        }
        const time = timeMatch[1];
        await game.SetAutoTime(msg.guild.id, time);
        msg.channel.send(`✅ Время авторулетки установлено на **${time} UTC**. Это ${time} по UTC — не забудь пересчитать под свой часовой пояс.`);
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
        msg.channel.send("✅ Авторулетка отключена. Используй `!setканал` чтобы включить снова.");
        return;
    }

    // Показать текущие настройки авторулетки
    if (msg.content.match(/^!autoинфо/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        const settings = await game.GetAutoSettings(msg.guild.id);
        if (!settings || !settings.auto_channel_id) {
            msg.channel.send("⚙️ Авторулетка не настроена. Используй `!setканал` в нужном канале.");
        } else {
            msg.channel.send(`⚙️ Авторулетка: канал <#${settings.auto_channel_id}>, время **${settings.auto_time} UTC**`);
        }
        return;
    }

    // Сброс и повторная настройка авторулетки (фикс если настройки слетели)
    if (msg.content.match(/^!resetканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            msg.channel.send("Только администратор! 🚫");
            return;
        }
        // Удаляем старую запись и создаём новую с каналом и временем по умолчанию
        await game.ResetAutoSettings(msg.guild.id, msg.channel.id);
        msg.channel.send(`✅ Настройки авторулетки сброшены. Канал установлен на этот. Время: **09:00 UTC**. Используй \`!setвремя ЧЧ:ММ\` чтобы сменить время.`);
        return;
    }

    // Помощь
    if (msg.content.match(/^!пидорхелп/)) {
        const help = [
            "**🎲 Команды бота:**",
            "`!пидордня` — записаться в участники",
            "`!ктопидор` — запустить рулетку (1 раз в сутки)",
            "`!топпидоров` — топ-10 за всё время",
            "`!пидоргода` — объявить пидора года (31 декабря)",
            "`!пидоргода2026` — архив пидора конкретного года",
            "`!сброспидоров` — обнулить всю статистику (только для админов)",
            "`!исключить @user` — исключить участника (только для админов)",
            "`!setканал` — установить канал для авторулетки (только для админов)",
            "`!setвремя 09:00` — установить время авторулетки в UTC (только для админов)",
            "`!delканал` — отключить авторулетку (только для админов)",
            "`!autoинфо` — показать настройки авторулетки",
        ].join("\n");
        msg.channel.send(help);
        ChatFunctions.deleteMessage(msg, 1000);
        return;
    }
});

// Авторулетка — запускается каждую минуту и проверяет время
setInterval(async () => {
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    console.log(`[CRON] Проверка авторулетки: ${currentTime} UTC`);

    const guilds = await game.GetAllAutoSettings();
    const allSettings = await game.GetAllAutoSettingsDebug();
    console.log(`[CRON] Серверов с авторулеткой: ${guilds.length}, всего записей в guild_settings: ${allSettings.length}`);
    allSettings.forEach(s => console.log(`[CRON DEBUG] guild=${s.discord_guild_id} channel=${s.auto_channel_id} time=${s.auto_time}`));

    for (const settings of guilds) {
        console.log(`[CRON] Сервер ${settings.discord_guild_id}: время=${settings.auto_time}, нужно=${currentTime}`);
        if (settings.auto_time !== currentTime) continue;
        if (!settings.auto_channel_id) continue;

        const channel = client.channels.cache.get(settings.auto_channel_id);
        if (!channel) {
            console.log(`[CRON] Канал ${settings.auto_channel_id} не найден в кеше`);
            continue;
        }

        const guild_id = settings.discord_guild_id;
        console.log(`[CRON] Запускаю авторулетку на сервере ${guild_id}`);

        // Проверяем участников
        const participant = await participantsRepository.GetRandomParticipant(guild_id);
        if (!participant) {
            console.log(`[CRON] Нет участников на сервере ${guild_id}`);
            continue;
        }

        // Проверяем не играли ли уже сегодня
        try {
            await game.CanStartGame(guild_id);
        } catch {
            console.log(`[CRON] На сервере ${guild_id} уже играли сегодня`);
            continue;
        }

        // Запускаем рулетку
        if (activeGames.has(guild_id)) continue;
        activeGames.add(guild_id);
        try {
            await game.Tease(channel);
            const winMsg = await game.Run(guild_id);
            channel.send(winMsg);
            console.log(`[CRON] Авторулетка успешно запущена на сервере ${guild_id}`);
        } catch (err) {
            console.error(`[CRON] Ошибка авторулетки на сервере ${guild_id}:`, err);
        } finally {
            activeGames.delete(guild_id);
        }
    }
}, 60000); // проверяем каждую минуту

client.login(process.env.BOT_TOKEN).then(() => {
    console.log("Бот успешно вошёл в систему!");
});
