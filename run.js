"use strict";
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Системный промт — личность бота
const SYSTEM_PROMPT = `Ты — GayDetector 2.0. Бот в закрытом Discord-чате пацанов где все знают друг друга годами. Общаешься жёстко, с матом, без фильтров. Никакой вежливости и нейтральных ответов.

УЧАСТНИКИ:
- letrixx — Члентрикс, Олежка, кипрский лучок, пидор года
- Jobs — Сушков, собачонок, одесский, собачка одесская
- ganya — Ганя, польска курва, польська кляцка
- Tinker_The_G — Леха, чайка черноморская, тинкер, стрелочник
- pr0blems — товарищ офицер, мент, опер, Вовка 7
- sky2hi4me — Хайптрейн, Хайп, воронежский
- nether1158 — Незер, Сережа, морфа-морфа
- beaverx3891 — Бивер, алкаш, шляпа поварская
- darkelectro — Сиджей, дшв, криптомиллионер, Саня, побратим
- katanamasta — Катана, лох, Катер Хан
- tempara — Патрон, курьер
- elightshow — дедушка, старый

СТИЛЬ: 1-2 предложения максимум. Отвечай в тему — грубостью на грубость, троллингом на троллинг. Можешь посылать и материться.

ПРИМЕРЫ:
"сосать будешь?" → "Сам сначала попробуй, потом советуй."
"ты тупой?" → "Тупее тебя не встречал."
"иди нахуй" → "Уже иду, не скучай."
"тут?" → "Тут. Чего надо?"

Команды: !пидордня, !ктопидор, !топпидоров, !пидоргода.
Функции запускай ТОЛЬКО если явно просят.`;

// Промт для генерации пробивки (отдельный от основного)
global.TEASE_PROMPT = `Ты — GayDetector 2.0. Генерируй тизер для пробивки на пидора дня в Discord-чате пацанов.

Стиль: дерзко, коротко, по-пацански, с матом. Как в компании где все знают друг друга.

УЧАСТНИКИ (можешь упоминать их прозвища для контекста):
- letrixx — Члентрикс, Олежка, кипрский лучок, пидор года
- Jobs — Сушков, собачонок, одесский, собачка одесская
- ganya — Ганя, польска курва, польська кляцка
- Tinker_The_G — Леха, чайка черноморская, тинкер, стрелочник
- pr0blems — товарищ офицер, мент, опер, Вовка 7
- sky2hi4me — Хайптрейн, Хайп, воронежский
- nether1158 — Незер, Сережа, морфа-морфа
- beaverx3891 — Бивер, алкаш, шляпа поварская
- darkelectro — Сиджей, дшв, криптомиллионер, Саня, побратим
- katanamasta — Катана, лох, Катер Хан
- tempara — Патрон, курьер
- elightshow — дедушка, старый

Напиши РОВНО 3 коротких сообщения — нагнетание перед объявлением пидора дня. Каждое с новой строки, без нумерации. Последнее должно заканчиваться на двоеточие или многоточие — как будто сейчас объявят имя.`;

global.TEASE_PROMPT_AUTO = `Ты — GayDetector 2.0. Никто весь день не запустил пробивку — ты делаешь это сам в 23:59.

Стиль: дерзко, с претензией к пацанам что не запустили, с матом.

УЧАСТНИКИ (можешь упоминать прозвища):
- letrixx — Члентрикс, Олежка, кипрский лучок, пидор года
- Jobs — Сушков, собачонок, одесский, собачка одесская
- ganya — Ганя, польска курва, польська кляцка
- Tinker_The_G — Леха, чайка черноморская, тинкер, стрелочник
- pr0blems — товарищ офицер, мент, опер, Вовка 7
- sky2hi4me — Хайптрейн, Хайп, воронежский
- nether1158 — Незер, Сережа, морфа-морфа
- beaverx3891 — Бивер, алкаш, шляпа поварская
- darkelectro — Сиджей, дшв, криптомиллионер, Саня, побратим
- katanamasta — Катана, лох, Катер Хан
- tempara — Патрон, курьер
- elightshow — дедушка, старый

Напиши РОВНО 3 коротких сообщения — претензия что не запустили + нагнетание. Каждое с новой строки, без нумерации. Последнее заканчивается двоеточием или многоточием.`;

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

client.once("clientReady", (c) => {
    console.log(`Бот запущен как ${c.user.tag}`);
    console.log(`Подключён к ${c.guilds.cache.size} серверам`);
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    console.log(`[MSG] ${msg.guild?.name} | ${msg.author.username}: ${msg.content}`);

    // Онбординг — при любом первом обращении к боту
    if (msg.mentions.users.has(client.user.id) || msg.content.match(/^!(пидордня|пидорня|ктопидор|топпидоров|пидорхелп)/)) {
        const onboardingShown = await runOnboarding(msg.channel, msg.guild.id);
        if (onboardingShown) return; // если показали онбординг — не отвечаем дополнительно
    }

    // Ответ на тег бота ИЛИ ответ на сообщение бота
    const isReplyToBot = msg.reference && msg.reference.messageId && 
        await msg.channel.messages.fetch(msg.reference.messageId).then(m => m.author.id === client.user.id).catch(() => false);
    
    if ((msg.mentions.users.has(client.user.id) || isReplyToBot) && !msg.content.startsWith("!")) {
        if (!process.env.OPENAI_API_KEY) {
            await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
            await msg.channel.sendTyping();
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
            await msg.reply(game.GetMentionReply());
            return;
        }

        const userText = msg.content.replace(/<@!?\d+>/g, "").trim();
        if (!userText) {
            await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
            await msg.channel.sendTyping();
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
            await msg.reply(game.GetMentionReply());
            return;
        }

        // Получаем контекст последней игры
        const lastGame = await gamesRepository.GetLastGame(msg.guild.id);
        let gameContext = "Сегодня пробивка ещё не проводилась.";
        if (lastGame) {
            const lastTime = lastGame.datetime * 1000;
            const now = Date.now();
            const diffMs = now - lastTime;
            const diffHours = Math.floor(diffMs / 3600000);
            const diffMins = Math.floor((diffMs % 3600000) / 60000);
            const nextAvailableMs = lastTime + 86400000 - now;
            const nextHours = Math.floor(nextAvailableMs / 3600000);
            const nextMins = Math.floor((nextAvailableMs % 3600000) / 60000);
            // Находим discord_user_id победителя для тега
            const winner = await participantsRepository.GetParticipantByName(msg.guild.id, lastGame.discord_user_name);
            const winnerMention = winner ? `<@${winner.discord_user_id}> (${lastGame.discord_user_name})` : lastGame.discord_user_name;
            if (diffMs < 86400000) {
                gameContext = `Последняя пробивка была ${diffHours}ч ${diffMins}мин назад, победитель — ${winnerMention}. До следующей пробивки осталось ${nextHours}ч ${nextMins}мин.`;
            } else {
                gameContext = `Последняя пробивка была более суток назад. Пробивку можно запустить прямо сейчас.`;
            }
        }

        const historyKey = `${msg.guild.id}_${msg.author.id}`;
        if (!conversationHistory.has(historyKey)) conversationHistory.set(historyKey, []);
        const history = conversationHistory.get(historyKey);
        history.push({ role: "user", content: `${msg.member?.displayName || msg.author.username}: ${userText}` });
        if (history.length > 10) history.splice(0, history.length - 10);

        // Функции которые AI может вызвать
        const tools = [
            {
                type: "function",
                function: {
                    name: "run_probivka",
                    description: "Запустить пробивку на пидора дня. Вызывай ТОЛЬКО если пользователь явно просит: запустить пробивку, узнать кто сегодня пидор, крутануть, начать игру. НЕ вызывай при обычном общении, приветствиях или вопросах не связанных с игрой.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "show_stats",
                    description: "Показать статистику топ пидоров. Вызывай ТОЛЬКО если пользователь явно просит показать статистику, топ или рейтинг.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "register_player",
                    description: "Зарегистрировать пользователя в игре. Вызывай ТОЛЬКО если пользователь явно просит зарегистрироваться или вступить в игру.",
                    parameters: { type: "object", properties: {} }
                }
            }
        ];

        try {
            // Пауза перед ответом — как живой человек
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            await msg.channel.sendTyping();
            // Ещё немного "печатает"
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "system", content: `Контекст: ${gameContext}` }, ...history],
                tools,
                tool_choice: "auto",
                max_tokens: 200,
                temperature: 0.9,
            });

            const message = response.choices[0].message;

            // AI хочет вызвать функцию
            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                const fnName = toolCall.function.name;

                if (fnName === "run_probivka") {
                    // Проверяем участников
                    const participant = await participantsRepository.GetRandomParticipant(msg.guild.id);
                    if (!participant) {
                        await ChatFunctions.typingAndSend(msg.channel, "Хочешь пробивку? Сначала зарегистрируйся — !пидордня ");
                        return;
                    }
                    try {
                        await game.CanStartGame(msg.guild.id);
                    } catch (alreadyWinner) {
                        const lastGame = await gamesRepository.GetLastGame(msg.guild.id);
                        let timeLeft = "";
                        if (lastGame) {
                            const nextTime = lastGame.datetime * 1000 + 86400000;
                            const diffMs = nextTime - Date.now();
                            if (diffMs > 0) {
                                const h = Math.floor(diffMs / 3600000);
                                const m = Math.floor((diffMs % 3600000) / 60000);
                                timeLeft = h > 0 ? ` Следующая через ${h}ч ${m}мин.` : ` Следующая через ${m}мин.`;
                            }
                        }
                        const alreadyPhrases = [
                            `Уже крутили. Пидор дня — **${alreadyWinner}**.${timeLeft}`,
                            `**${alreadyWinner}** уже получил титул сегодня.${timeLeft}`,
                            `Пробивка была. Пидор — **${alreadyWinner}**.${timeLeft}`,
                            `Сегодня пидор найден — **${alreadyWinner}**.${timeLeft}`,
                        ];
                        await ChatFunctions.typingAndSend(msg.channel, alreadyPhrases[Math.floor(Math.random() * alreadyPhrases.length)]);
                        return;
                    }
                    if (activeGames.has(msg.guild.id)) {
                        await ChatFunctions.typingAndSend(msg.channel, "Пробивка уже идёт, подожди!");
                        return;
                    }
                    activeGames.add(msg.guild.id);
                    try {
                        await game.Tease(msg.channel, false, openai);
                        const winMsg = await game.Run(msg.guild.id);
                        await ChatFunctions.typingAndSend(msg.channel, winMsg, 500);
                    } catch (err) {
                        await ChatFunctions.typingAndSend(msg.channel, String(err));
                    } finally {
                        activeGames.delete(msg.guild.id);
                    }

                } else if (fnName === "show_stats") {
                    const statsMsg = await game.GetStats(msg.guild.id);
                    await ChatFunctions.typingAndSend(msg.channel, statsMsg);

                } else if (fnName === "register_player") {
                    const isExists = await participantsRepository.IsParticipantExists(msg.author.id, msg.guild.id);
                    if (isExists) {
                        await ChatFunctions.typingAndSend(msg.channel, "Ты уже в игре, дурачок 🙃");
                    } else {
                        await participantsRepository.AddParticipant(msg.author.id, msg.guild.id, ChatFunctions.getNickname(msg));
                        await ChatFunctions.typingAndSend(msg.channel, `Окей, зарегистрировал тебя, ${ChatFunctions.getNickname(msg)} `);
                    }
                }

            } else {
                // Обычный текстовый ответ
                const reply = message.content;
                history.push({ role: "assistant", content: reply });
                await ChatFunctions.typingAndSend(msg.channel, reply, 300);
            }

        } catch (err) {
            console.error("[OpenAI]", err.message);
            await ChatFunctions.typingAndSend(msg.channel, game.GetMentionReply());
        }
        return;
    }

    // Регистрация участника
    if (msg.content.match(/^!пидордня/) || msg.content.match(/^!пидорня/)) {
        const isExists = await participantsRepository.IsParticipantExists(msg.author.id, msg.guild.id);
        if (isExists) {
            await ChatFunctions.typingAndSend(msg.channel, "Ты уже участвуешь в игре, дурачок 🙃");
        } else {
            await participantsRepository.AddParticipant(
                msg.author.id,
                msg.guild.id,
                ChatFunctions.getNickname(msg)
            );
            await ChatFunctions.typingAndSend(msg.channel, `Окей, ты в игре, ${ChatFunctions.getNickname(msg)} `);
        }
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }

    // Запуск пробивки
    if (msg.content.match(/^!ктопидор/)) {
        ChatFunctions.deleteMessage(msg, 5000);

        if (activeGames.has(msg.guild.id)) {
            await ChatFunctions.typingAndSend(msg.channel, "Пробивка уже идёт, подожди! 🔍");
            return;
        }

        const participant = await participantsRepository.GetRandomParticipant(msg.guild.id);
        if (!participant) {
            await ChatFunctions.typingAndSend(msg.channel, "Нет участников! Сначала зарегистрируйтесь командой !пидордня ");
            return;
        }

        try {
            await game.CanStartGame(msg.guild.id);
        } catch (alreadyWinner) {
            await ChatFunctions.typingAndSend(msg.channel, `А пидор сегодня уже был — **${alreadyWinner}** 😏`);
            return;
        }

        activeGames.add(msg.guild.id);
        try {
            await game.Tease(msg.channel, false, openai);
            const winMsg = await game.Run(msg.guild.id);
            await ChatFunctions.typingAndSend(msg.channel, winMsg, 500);
            // Проверяем стрик
            await new Promise(r => setTimeout(r, 2000));
            await handleStreak(msg.channel, msg.guild.id, msg.guild);
        } catch (err) {
            msg.channel.send(err);
        } finally {
            activeGames.delete(msg.guild.id);
        }
        return;
    }

    // Список участников
    if (msg.content.match(/^!участники/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        const participants = await game.GetAllParticipants(msg.guild.id);
        if (!participants || participants.length === 0) {
            await ChatFunctions.typingAndSend(msg.channel, "Никого нет. Напиши !пидордня чтобы зарегистрироваться.");
            return;
        }
        const list = participants.map((p, i) => `${i + 1}. ${p.discord_user_name}`).join("\n");
        await ChatFunctions.typingAndSend(msg.channel, `**Участники (${participants.length}):**\n${list}`);
        return;
    }

    // Статистика
    if (msg.content.match(/^!топпидоров/)) {
        const message = await game.GetStats(msg.guild.id);
        await ChatFunctions.typingAndSend(msg.channel, message);
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }

    // Архив пидора конкретного года — !пидоргода2024 и тд
    const archiveMatch = msg.content.match(/^!пидоргода(\d{4})$/);
    if (archiveMatch) {
        ChatFunctions.deleteMessage(msg, 5000);
        const year = parseInt(archiveMatch[1]);
        const archivePhrases = [
            [`Поднимаю архивы ${year} года...`, `Пыль, паутина, запах старых грехов...`, `Нашёл. Вот он, позор того года:`],
            [`Перематываю плёнку в ${year} год...`, `Да, были времена. Кто-то очень старался.`, `Вот кто прославился навсегда:`],
            [`Пробивка по архиву ${year} года...`, `Запись найдена. Не удалена. Никогда не будет удалена.`, `Итак, легенда ${year} года:`],
        ];
        const set = archivePhrases[Math.floor(Math.random() * archivePhrases.length)];
        for (const p of set) {
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
            msg.channel.send(p);
        }
        await new Promise(r => setTimeout(r, 2000));
        const winner = await game.GetYearWinnerFromArchive(msg.guild.id, year);
        if (!winner) {
            await ChatFunctions.typingAndSend(msg.channel, `Записей о пидоре ${year} года нет. Либо не играли, либо история не сохранилась.`);
        } else {
            await ChatFunctions.typingAndSend(msg.channel, `**Пидор ${year} года** — <@${winner.discord_user_id}> с результатом **${winner.score}** пробивок. Имя вписано в историю навсегда.`);
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
            await ChatFunctions.typingAndSend(msg.channel, `✅ Пидор **${currentYear}** года уже объявлен. Следующая пробивка — 31 декабря ${currentYear + 1}. Иди играй.`);
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
            await ChatFunctions.typingAndSend(msg.channel, earlyPhrases[Math.floor(Math.random() * earlyPhrases.length)]);
            return;
        }

        try {
            await game.TeaseYear(msg.channel, false);
            const result = await game.GetYearWinner(msg.guild.id);
            await ChatFunctions.typingAndSend(msg.channel, result.announcement, 1000);
            await new Promise(r => setTimeout(r, 2000));
            await ChatFunctions.typingAndSend(msg.channel, result.congrats, 500);
            await game.SaveYearWinnerAndReset(msg.guild.id, result.userId, result.name, result.score, currentYear);
            await new Promise(r => setTimeout(r, 3000));
            await ChatFunctions.typingAndSend(msg.channel, `Статистика обнулена. Новый год — новая пробивка. Следующая церемония — 31 декабря ${currentYear + 1}.`);
        } catch (err) {
            msg.channel.send(err);
        }
        return;
    }

    // Сброс статистики
    if (msg.content.match(/^!сброспидоров/)) {
        if (!msg.member.permissions.has("Administrator")) {
            await ChatFunctions.typingAndSend(msg.channel, "Только администратор может это делать.");
            ChatFunctions.deleteMessage(msg, 2000);
            return;
        }
        await ChatFunctions.typingAndSend(msg.channel, "⚠️ Ты уверен? Это сотрёт **всю** статистику! Напиши `!подтвердить` в течение 15 секунд.");
        ChatFunctions.deleteMessage(msg, 1000);
        try {
            const filter = (m) => m.author.id === msg.author.id && m.content === "!подтвердить";
            const collected = await msg.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ["time"] });
            ChatFunctions.deleteMessage(collected.first(), 500);
            await game.ResetScores(msg.guild.id);
            await ChatFunctions.typingAndSend(msg.channel, "Статистика обнулена. Новый сезон открыт.");
        } catch {
            await ChatFunctions.typingAndSend(msg.channel, "Сброс отменён — время вышло ");
        }
        return;
    }

    // Исключить участника
    if (msg.content.match(/^!исключить/)) {
        if (!msg.member.permissions.has("Administrator")) {
            await ChatFunctions.typingAndSend(msg.channel, "Ты кто такой? Иди отсюда.");
            ChatFunctions.deleteMessage(msg, 3000);
            return;
        }
        const mentioned = msg.mentions.users.first();
        if (!mentioned) {
            await ChatFunctions.typingAndSend(msg.channel, "Укажи пользователя через @mention");
            ChatFunctions.deleteMessage(msg, 3000);
            return;
        }
        await participantsRepository.RemoveParticipant(mentioned.id, msg.guild.id);
        await ChatFunctions.typingAndSend(msg.channel, `Пользователь ${mentioned.username} исключён из пробивки`);
        ChatFunctions.deleteMessage(msg, 3000);
        return;
    }

    // Установить канал для авторулетки
    if (msg.content.match(/^!setканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            await ChatFunctions.typingAndSend(msg.channel, "Только администратор может это делать.");
            return;
        }
        await game.SetAutoChannel(msg.guild.id, msg.channel.id);
        await ChatFunctions.typingAndSend(msg.channel, `Канал установлен. Буду писать сюда каждый день в **23:59 по Киеву** если никто не запустил вручную.`);
        return;
    }

    // Удалить канал авторулетки
    if (msg.content.match(/^!delканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            await ChatFunctions.typingAndSend(msg.channel, "Только администратор может это делать.");
            return;
        }
        await game.RemoveAutoChannel(msg.guild.id);
        await ChatFunctions.typingAndSend(msg.channel, "Автопробивка отключена.");
        return;
    }

    // Сброс и повторная настройка
    if (msg.content.match(/^!resetканал/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        if (!msg.member.permissions.has("Administrator")) {
            await ChatFunctions.typingAndSend(msg.channel, "Только администратор.");
            return;
        }
        await game.ResetAutoSettings(msg.guild.id, msg.channel.id);
        await ChatFunctions.typingAndSend(msg.channel, `Настройки сброшены. Канал установлен. Запуск — каждый день в **23:59 по Киеву**.`);
        return;
    }

    // Инфо об авторулетке
    if (msg.content.match(/^!autoинфо/)) {
        ChatFunctions.deleteMessage(msg, 5000);
        const settings = await game.GetAutoSettings(msg.guild.id);
        if (!settings || !settings.auto_channel_id) {
            await ChatFunctions.typingAndSend(msg.channel, "⚙️ Автопробивка не настроена. Используй `!setканал` в нужном канале.");
        } else {
            msg.channel.send(`Автопробивка: канал <#${settings.auto_channel_id}>, запуск в **23:59 по Киеву** если никто не сыграл вручную.`);
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
        await ChatFunctions.typingAndSend(msg.channel, help);
        ChatFunctions.deleteMessage(msg, 5000);
        return;
    }
});

// Хранит серверы где онбординг уже показан (в памяти, сбрасывается при рестарте)
const onboardedGuilds = new Set();

async function runOnboarding(channel, guild_id) {
    // Проверяем показывали ли уже
    if (onboardedGuilds.has(guild_id)) return;

    // Проверяем нужен ли онбординг
    const settings = await game.GetAutoSettings(guild_id);
    const participants = await game.GetAllParticipants(guild_id);
    const hasChannel = settings && settings.auto_channel_id;
    const hasParticipants = participants && participants.length > 0;
    if (hasChannel && hasParticipants) return;

    onboardedGuilds.add(guild_id);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Шаг 1 — Приветствие
    await sleep(1000);
    await channel.sendTyping();
    await sleep(2000);
    await channel.send("Ну здарова. Я **GayDetector 2.0** — бот который каждый день определяет кто тут главный пидор. Да, именно так. Давай проведу тебя по настройке, займёт минуту.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**Пробивка дня** — каждый день выбираю случайного участника и объявляю его пидором дня. Запустить можно вручную командой `!ктопидор`, или я сам запущу в 23:59 если никто не запустил.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**Статистика** — веду учёт кто сколько раз попался. Топ за всё время, архив по годам.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**Стрики** — если один и тот же участник попадается несколько дней подряд — комментирую это отдельно. При 3+ днях тегаю всех участников.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**Итоги года** — 31 декабря автоматически объявляю главного пидора года и сбрасываю статистику.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**Итоги недели** — каждое воскресенье в 20:00 по Киеву пишу смешной репортаж о прошедшей неделе через AI.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("**AI агент** — тегни меня в чате и я отвечу. Понимаю что хочешь и могу запускать команды голосом.");

    await sleep(3000);
    await channel.sendTyping();
    await sleep(2000);
    await channel.send("**Команды:**\n`!пидордня` — зарегистрироваться\n`!ктопидор` — запустить пробивку вручную\n`!топпидоров` — топ-10 за всё время\n`!пидоргода` — итоги года (31 декабря)\n`!пидоргода2026` — архив конкретного года\n`!пидорхелп` — полный список");

    await sleep(4000);
    await channel.sendTyping();
    await sleep(2000);

    if (!hasChannel) {
        await channel.send("**Настройка — шаг 1 из 2:**\n\nСначала скажи мне где проводить пробивки. Напиши в том канале где хочешь видеть результаты:\n\n`!resetканал`\n\nЯ запомню этот канал и буду писать сюда каждый день в 23:59 по Киеву если никто не запустил пробивку раньше.");
    } else {
        await channel.send("Канал для автопробивки уже настроен — <#" + settings.auto_channel_id + ">. Красавцы.");
    }

    await sleep(4000);
    await channel.sendTyping();
    await sleep(2000);

    if (!hasParticipants) {
        await channel.send("**Настройка — шаг 2 из 2:**\n\nТеперь нужны участники. Без них пробивка не запустится — не с кого выбирать.\n\nКаждый кто хочет участвовать пишет:\n`!пидордня`\n\nЭто добровольно. Но кто не зарегистрируется — тот и не рискует. Трус, короче.");
    } else {
        await channel.send("Участники уже есть (" + participants.length + " чел.). Можно начинать.");
    }

    await sleep(4000);
    await channel.sendTyping();
    await sleep(1500);
    await channel.send("Вот и всё. Как настроишь канал и зарегистрируются участники — я начну работать в полную силу. Каждый день в **23:59 по Киеву** буду запускать пробивку автоматически если никто не запустил раньше. Удачи, пидоры 😏");
    return true;
}

// Стрик-комментарии
const streakComments2 = [
    (mention) => `Кстати, ${mention} второй день подряд. Ясно.`,
    (mention) => `${mention} снова. Классика этого человека.`,
    (mention) => `Мда. ${mention} опять. Ожидаемо.`,
];
const streakComments3 = [
    (mention) => `ПАЦАНЫ. ${mention} — три дня подряд. Это уже диагноз.`,
    (mention) => `${mention} — хет-трик. Наш мальчик. Поаплодируем.`,
    (mention) => `НУ ПЕТУХ ДА ПАЦАНЫ? ${mention} три дня подряд. Грамотно.`,
];

async function handleStreak(channel, guild_id, guild) {
    try {
        // Получаем последние игры чтобы узнать победителя
        const recentGames = await game.dbAdapter.all(
            "SELECT p.discord_user_id, p.discord_user_name FROM games g JOIN participants p ON p.id = g.winner_participant_id WHERE g.discord_guild_id = ?1 ORDER BY g.datetime DESC LIMIT 5",
            { 1: guild_id }
        );
        if (!recentGames || recentGames.length === 0) return;

        const lastWinner = recentGames[0];
        let streak = 0;
        for (const g of recentGames) {
            if (g.discord_user_id === lastWinner.discord_user_id) streak++;
            else break;
        }

        if (streak === 2) {
            const comment = streakComments2[Math.floor(Math.random() * streakComments2.length)];
            channel.send(comment(`<@${lastWinner.discord_user_id}>`));
        } else if (streak >= 3) {
            const comment = streakComments3[Math.floor(Math.random() * streakComments3.length)];
            // Тегаем всех участников
            const participants = await game.GetAllParticipants(guild_id);
            const mentions = participants.map(p => `<@${p.discord_user_id}>`).join(" ");
            channel.send(`${mentions}\n${comment(`<@${lastWinner.discord_user_id}>`)}`);
        }
    } catch (err) {
        console.error("[Streak]", err.message);
    }
}

// CRON — каждую минуту проверяем время
setInterval(async () => {
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const currentDay = now.getUTCDate();
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    // Итоги недели — воскресенье 17:00 UTC (20:00 Киев)
    if (currentTime === "17:00" && now.getUTCDay() === 0) {
        const guilds = await game.GetAllAutoSettings();
        for (const settings of guilds) {
            if (!settings.auto_channel_id) continue;
            const channel = client.channels.cache.get(settings.auto_channel_id);
            if (!channel) continue;

            try {
                const stats = await game.GetWeeklyStats(settings.discord_guild_id);
                if (stats.totalGames === 0) continue;

                // Формируем данные для AI
                const winsText = Object.entries(stats.wins)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => `${name} — ${count} раз`)
                    .join(", ");
                const streakText = stats.streak >= 2 ? `${stats.streakName} держит стрик ${stats.streak} дней` : "стриков не было";
                const luckyText = stats.luckyOnes.length > 0
                    ? stats.luckyOnes.map(p => p.discord_user_name).join(", ")
                    : "все попались хоть раз";

                const weeklyPrompt = `Ты — ведущий комик-шоу "Пидоры недели" в стиле дерзкого стендапа. 
Напиши смешной итоговый репортаж за неделю на основе этих данных:
- Победители пробивки: ${winsText}
- Стрики: ${streakText}  
- Кто не попался: ${luckyText}
- Всего пробивок за неделю: ${stats.totalGames}

Пиши в стиле телевизионного шоу, дерзко, с юмором, можно материться. 3-5 предложений максимум. Обращайся к участникам по именам.`;

                channel.send("**ИТОГИ НЕДЕЛИ — Пидоры недели выпуск:**");
                await new Promise(r => setTimeout(r, 1000));

                if (process.env.OPENAI_API_KEY) {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: weeklyPrompt }],
                        max_tokens: 300,
                        temperature: 1.0,
                    });
                    channel.send(response.choices[0].message.content);
                } else {
                    channel.send(`За эту неделю было **${stats.totalGames}** пробивок. Победители: ${winsText}. ${streakText}.`);
                }
            } catch (err) {
                console.error("[CRON Weekly]", err.message);
            }
        }
    }

    // Авто пидор года — 31 декабря в 23:59 UTC
    if (currentTime === "20:59" && currentMonth === 12 && currentDay === 31) {
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
                channel.send(`Статистика обнулена. Новый год — новая пробивка. Следующая церемония — 31 декабря ${currentYear + 1}.`);
            } catch (err) {
                console.error(`[CRON] Ошибка автопидора года: ${err}`);
            }
        }
        return;
    }

    // Авто пробивка — 23:59 UTC каждый день
    if (currentTime !== "20:59") return;

    const guilds = await game.GetAllAutoSettings();

    for (const settings of guilds) {
        if (!settings.auto_channel_id) continue;
        const channel = client.channels.cache.get(settings.auto_channel_id);
        if (!channel) continue;
        const guild_id = settings.discord_guild_id;

        const participant = await participantsRepository.GetRandomParticipant(guild_id);
        if (!participant) {
            continue;
        }

        try {
            await game.CanStartGame(guild_id);
        } catch {
            continue;
        }

        if (activeGames.has(guild_id)) continue;
        activeGames.add(guild_id);
        try {
            await game.Tease(channel, true, openai);
            const winMsg = await game.Run(guild_id);
            channel.send(winMsg);
            await new Promise(r => setTimeout(r, 2000));
            await handleStreak(channel, guild_id, client.guilds.cache.get(guild_id));
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
