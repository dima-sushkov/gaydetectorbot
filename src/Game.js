const Misc = require("./Misc");

// ===== ФРАЗЫ ДЛЯ РУЧНОГО ЗАПУСКА =====
const teasePhrases = [
    [
        "Дядь, тут интересуются.",
        "Кто-то сегодня нас удивит.",
        "Ну пацаны, смотрим.",
    ],
    [
        "Слышь мальчик, выйди на минуту.",
        "Есть разговор.",
        "Лох обыкновенный, 1шт.:",
    ],
    [
        "Выехал.",
        "Еду по адресу.",
        "Звучит как угроза, но это факт:",
    ],
    [
        "Так не интересно? Сейчас будет интересно.",
        "Дело серьёзное.",
        "А ну все тогда. Пидор дня:",
    ],
    [
        "Чья очередь? Сейчас узнаем.",
        "Та ты уже прокрученный.",
        "Это уровень:",
    ],
    [
        "Бля та за шо так.",
        "Не твоя вот и бесишься.",
        "Наш мальчик:",
    ],
    [
        "Погнали пацаны, смотрим.",
        "Кто там засухарился.",
        "Фух, ну слава богу это не про меня. Хотя... это про:",
    ],
    [
        '"Миндич" тут?',
        '"Арахамия" тут?',
        "Товарищ офицер, @pr0blems с вашего разрешения позвольте объявить пидора дня:",
    ],
];

// ===== ФРАЗЫ ДЛЯ АВТОРАПУСКА В 23:59 =====
const autoTeasePhrases = [
    [
        "Целый день молчали. Ладно, сам разберусь.",
        "Пробивка пошла. Спокойной ночи.",
        "Ясно кто тут главный лох.",
    ],
    [
        "Пацаны не запустили. Ну и хуй с вами.",
        "Делаю сам. Не впервой.",
        "Получайте результат.",
    ],
    [
        "23:59. Никто. Грамотно, молодцы.",
        "Выезжаю на место без вашего разрешения.",
        "Классика этого сервера.",
    ],
    [
        "А могли сами. Но нет.",
        "Ищу пидора. Долго искать не придётся.",
        "Ну как обычно.",
    ],
    [
        "Woob-woob. Сами напросились.",
        "Машины выехали без команды.",
        "Наш мальчик сегодня вот этот:",
    ],
];

const resultPhrases = [
    "Ну ты и пидор, ",
    "Вот ты и пидор, ",
    "Сегодня ты пидор, ",
    "НУ ПЕТУХ, ДА ПАЦАНЫ? Сегодня это ",
    "Наш мальчик сегодня — ",
    "Ожидаемо. Пидор дня — ",
    "Классика. Пидор дня — ",
    "Грамотно. Пидор дня — ",
    "Пацаны, смотрите. Пидор дня — ",
    "Мда. Пидор дня — ",
    "Ясно. Пидор — ",
    "Брат, ты пидор. ",
    "Шляпа. Пидор дня — ",
    "А ну в хату зайди, ",
    "Ты сегодня пидор ",
];

// ===== ФРАЗЫ ДЛЯ ПИДОРА ГОДА (РУЧНОЙ ЗАПУСК) =====
const yearTeasePhrases = [
    [
        "Ладно, запускаю годовую пробивку...",
        "Да чё тут искать, если честно. Тут всё видно невооружённым глазом.",
        "Главный пидор этого сервера давно известен. И он это знает.",
    ],
    [
        "Поднимаю статистику за весь год...",
        "Таблица говорит сама за себя. Первая строчка — как мемориальная доска.",
        "Имя одно. Отрыв — космический. Конкурентов — ноль.",
    ],
    [
        "Листаю годовое дело...",
        "Страница 1: пидор. Страница 2: пидор. Страница 47: снова пидор.",
        "Дело прочитано. Выводы однозначны. Апелляций не принимается.",
    ],
    [
        "Провожу независимую экспертизу по итогам года...",
        "Эксперты совещались ровно 0.3 секунды. Консенсус достигнут мгновенно.",
        "Жюри единогласно. Зрители согласны. Даже он сам, наверное, согласен:",
    ],
    [
        "Годовая пробивка... А тут вопросов нет. Никаких.",
        "Остальные участники — статисты. Добросовестные, но статисты.",
        "Корона пидорства лежала и ждала весь год. Хозяин нашёлся:",
    ],
];

// ===== ФРАЗЫ ДЛЯ АВТОПИДОРА ГОДА 31 ДЕКАБРЯ =====
const autoYearTeasePhrases = [
    [
        "Всё пидоры, год закончился.",
        "Годовая пробивка запущена автоматически. Смотрим кто за этот год засветился больше всех.",
        "База данных поднята. Статистика собрана. Позор задокументирован.",
    ],
    [
        "31 декабря. Время подводить итоги.",
        "Год прошёл. Пробивка по итогам года запущена.",
        "Смотрим кто в этом году старался больше всех. Имена записаны.",
    ],
    [
        "Последний день года. Годовая пробивка активирована.",
        "Все данные за год подняты. Картина ясная.",
        "Называем главного пидора года. Барабанная дробь...",
    ],
];

const yearWinnerPhrases = [
    "ПИДОР ГОДА — без интриг, без сюрпризов — это, конечно же, ",
    "Год прошёл. Пробивка завершена. Главный петух года среди нас, и это — ",
    "Орден «Пидор Года» первой степени с кисточками торжественно вручается — ",
    "История запишет это имя. Пидор года, чемпион, рекордсмен — ",
    "Годовая пробивка чистая. Главный пидор этого года — ",
];

// ===== АВТООТВЕТЫ НА ТЕГ БОТА =====
const mentionReplies = [
    "Тут. Чего надо?",
    "Ало.",
    "Да брат.",
    "Слышу.",
    "Ну?",
    "Чего тебе, пацан?",
    "Тут я, тут. Пробивку запускай давай.",
    "Ясно. Слушаю.",
];

class Game {
    constructor(dbAdapter, participantRepository, gamesRepository) {
        this.dbAdapter = dbAdapter;
        this.participantRepository = participantRepository;
        this.gamesRepository = gamesRepository;
    }

    async CanStartGame(guild_id) {
        return new Promise((resolve, reject) => {
            this.gamesRepository.GetLastGame(guild_id).then((game) => {
                if (game === undefined) {
                    resolve(true);
                    return;
                }
                if (game.datetime > Math.floor(Date.now() / 1000) - 86400) {
                    reject(game.discord_user_name);
                    return;
                }
                resolve(true);
            });
        });
    }

    async Tease(channel, auto = false) {
        const phrases = Misc.GetRandomElement(auto ? autoTeasePhrases : teasePhrases);
        await Misc.AsyncForEach(phrases, async (p) => {
            await Misc.Sleep(2500 + Math.random() * 5500).then(() => {
                channel.send(p);
            });
        });
        await Misc.Sleep(3500 + Math.random() * 2500);
    }

    async TeaseYear(channel, auto = false) {
        const phrases = Misc.GetRandomElement(auto ? autoYearTeasePhrases : yearTeasePhrases);
        await Misc.AsyncForEach(phrases, async (p) => {
            await Misc.Sleep(2000 + Math.random() * 4000).then(() => {
                channel.send(p);
            });
        });
        await Misc.Sleep(2500 + Math.random() * 2000);
    }

    GetMentionReply() {
        return Misc.GetRandomElement(mentionReplies);
    }

    async Run(guild_id) {
        return new Promise((resolve, reject) => {
            this.participantRepository.GetRandomParticipant(guild_id).then((participant) => {
                if (participant === null) {
                    reject("Нет участников! Сначала зарегистрируйтесь командой !пидордня");
                    return;
                }
                this.gamesRepository.SaveGameInformation(guild_id, participant.id);
                this.participantRepository.ScoreParticipant(participant.id);
                resolve(Misc.GetRandomElement(resultPhrases) + "<@" + participant.discord_user_id + "> 🏆");
            });
        });
    }

    GetStats(guild_id) {
        return new Promise((resolve) => {
            this.dbAdapter
                .all(
                    "SELECT discord_user_name, score FROM participants WHERE score > 0 AND discord_guild_id = ?1 ORDER BY score DESC LIMIT 10",
                    { 1: guild_id }
                )
                .then((rows) => {
                    if (rows.length === 0) {
                        resolve("Статистики пока нет. Сначала поиграйте! 🎲");
                        return;
                    }
                    const medals = ["🥇", "🥈", "🥉"];
                    let string = "**🏆 Топ-10 пидоров за всё время:**\n";
                    rows.forEach((row, index) => {
                        const medal = medals[index] || `${index + 1}.`;
                        string += `${medal} ${row.discord_user_name} — **${row.score}** раз\n`;
                    });
                    resolve(string);
                });
        });
    }

    GetYearWinner(guild_id) {
        return new Promise((resolve, reject) => {
            this.dbAdapter
                .get(
                    "SELECT discord_user_name, discord_user_id, score FROM participants WHERE score > 0 AND discord_guild_id = ?1 ORDER BY score DESC LIMIT 1",
                    { 1: guild_id }
                )
                .then((row) => {
                    if (!row) {
                        reject("Нет данных для определения пидора года. Сначала поиграйте! 🎲");
                        return;
                    }
                    const phrase = Misc.GetRandomElement(yearWinnerPhrases);
                    const announcement = `${phrase}<@${row.discord_user_id}>!`;
                    const congrats = [
                        `Поздравляем <@${row.discord_user_id}>! **${row.score}** раз за год — это не невезение, это талант. Редкий. Специфический. Но талант. Носи корону! 👑`,
                        `<@${row.discord_user_id}>, ты не просто пидор дня. Ты пидор ГОДА. Целого года. **${row.score}** пробивок. Это статистика, её не оспоришь. Ку-ка-ре-ку! 🎺`,
                        `<@${row.discord_user_id}> — пидор в хорошем смысле этого слова. И в плохом. И во всех остальных тоже. **${row.score}** раз — рекорд сервера. Легенда.`,
                        `Год прожит не зря. <@${row.discord_user_id}> набрал **${row.score}** пробивок и уходит в историю. Пусть следующий год принесёт ему что-нибудь другое. Хотя вряд ли. 😏`,
                        `Летопись сервера пополнилась. <@${row.discord_user_id}>, **${row.score}** раз — это не случайность. Это судьба. Вселенная просто указала на тебя пальцем. Много раз. 👆`,
                    ];
                    resolve({
                        announcement,
                        congrats: Misc.GetRandomElement(congrats),
                        name: row.discord_user_name,
                        score: row.score,
                        userId: row.discord_user_id,
                    });
                });
        });
    }

    async ResetScores(guild_id) {
        await this.dbAdapter.run(
            "UPDATE participants SET score = 0 WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
        await this.dbAdapter.run(
            "DELETE FROM games WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
    }

    async SaveYearWinnerAndReset(guild_id, user_id, user_name, score, year) {
        this.dbAdapter.run(
            "INSERT INTO year_winners (discord_guild_id, discord_user_id, discord_user_name, year, score, datetime) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            { 1: guild_id, 2: user_id, 3: user_name, 4: year, 5: score, 6: Math.floor(Date.now() / 1000) }
        );
        this.dbAdapter.run("UPDATE participants SET score = 0, excluded = 0 WHERE discord_guild_id = ?1", { 1: guild_id });
        this.dbAdapter.run("DELETE FROM games WHERE discord_guild_id = ?1", { 1: guild_id });
    }

    async IsYearWinnerDeclared(guild_id, year) {
        return this.dbAdapter
            .get(
                "SELECT id FROM year_winners WHERE discord_guild_id = ?1 AND year = ?2 LIMIT 1",
                { 1: guild_id, 2: year }
            )
            .then((row) => !!row);
    }

    async GetYearWinnerFromArchive(guild_id, year) {
        return this.dbAdapter
            .get(
                "SELECT discord_user_id, discord_user_name, score FROM year_winners WHERE discord_guild_id = ?1 AND year = ?2 LIMIT 1",
                { 1: guild_id, 2: year }
            )
            .then((row) => row || null);
    }

    async SetAutoChannel(guild_id, channel_id) {
        const current = await this.dbAdapter.get(
            "SELECT auto_time FROM guild_settings WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
        const time = current ? current.auto_time : "23:59";
        this.dbAdapter.run("DELETE FROM guild_settings WHERE discord_guild_id = ?1", { 1: guild_id });
        this.dbAdapter.run(
            "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, ?2, ?3)",
            { 1: guild_id, 2: channel_id, 3: time }
        );
    }

    async RemoveAutoChannel(guild_id) {
        this.dbAdapter.run(
            "UPDATE guild_settings SET auto_channel_id = NULL WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
    }

    async GetAutoSettings(guild_id) {
        return this.dbAdapter.get(
            "SELECT auto_channel_id, auto_time FROM guild_settings WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
    }

    async ResetAutoSettings(guild_id, channel_id) {
        await this.dbAdapter.run(
            "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, ?2, '23:59') ON CONFLICT (discord_guild_id) DO UPDATE SET auto_channel_id = ?2, auto_time = '23:59'",
            { 1: guild_id, 2: channel_id }
        );
    }

    async GetAllAutoSettings() {
        return this.dbAdapter.all(
            "SELECT discord_guild_id, auto_channel_id, auto_time FROM guild_settings WHERE auto_channel_id IS NOT NULL AND auto_channel_id != ''",
            {}
        );
    }

    async GetAllAutoSettingsDebug() {
        return this.dbAdapter.all(
            "SELECT discord_guild_id, auto_channel_id, auto_time FROM guild_settings",
            {}
        );
    }

    // Получить текущий стрик победителя (сколько дней подряд побеждает)
    async GetCurrentStreak(guild_id, user_id) {
        const games = await this.dbAdapter.all(
            "SELECT p.discord_user_id FROM games g JOIN participants p ON p.id = g.winner_participant_id WHERE g.discord_guild_id = ?1 ORDER BY g.datetime DESC LIMIT 10",
            { 1: guild_id }
        );
        let streak = 0;
        for (const g of games) {
            if (g.discord_user_id === user_id) streak++;
            else break;
        }
        return streak;
    }

    // Получить всех участников для тега
    async GetAllParticipants(guild_id) {
        return this.dbAdapter.all(
            "SELECT discord_user_id, discord_user_name FROM participants WHERE discord_guild_id = ?1 AND excluded = 0",
            { 1: guild_id }
        );
    }

    // Получить статистику за последние 7 дней для итогов недели
    async GetWeeklyStats(guild_id) {
        const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
        const games = await this.dbAdapter.all(
            "SELECT p.discord_user_id, p.discord_user_name FROM games g JOIN participants p ON p.id = g.winner_participant_id WHERE g.discord_guild_id = ?1 AND g.datetime > ?2 ORDER BY g.datetime ASC",
            { 1: guild_id, 2: weekAgo }
        );

        // Считаем победы за неделю
        const wins = {};
        for (const g of games) {
            wins[g.discord_user_name] = (wins[g.discord_user_name] || 0) + 1;
        }

        // Текущий стрик
        let streak = 0;
        let streakName = null;
        const recentGames = await this.dbAdapter.all(
            "SELECT p.discord_user_id, p.discord_user_name FROM games g JOIN participants p ON p.id = g.winner_participant_id WHERE g.discord_guild_id = ?1 ORDER BY g.datetime DESC LIMIT 7",
            { 1: guild_id }
        );
        for (const g of recentGames) {
            if (!streakName) streakName = g.discord_user_name;
            if (g.discord_user_name === streakName) streak++;
            else break;
        }

        // Кто ни разу не попался за неделю
        const allParticipants = await this.GetAllParticipants(guild_id);
        const winnersThisWeek = new Set(games.map(g => g.discord_user_name));
        const luckyOnes = allParticipants.filter(p => !winnersThisWeek.has(p.discord_user_name));

        return { wins, streak, streakName, luckyOnes, totalGames: games.length };
    }
}

module.exports = Game;
