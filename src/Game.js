const Misc = require("./Misc");

const teasePhrases = [
    [
        "🚔 Woob-woob, that's da sound of da пидор-police!",
        "Выезжаю на место... форма поглажена, дубинка заряжена, радар настроен на пидоров...",
        "Сигнал усиливается. Объект близко. Очень близко. Подозрительно близко...",
    ],
    [
        "🧬 Запускаю ДНК-тест на пидорство...",
        "Образцы взяты у всех участников. Лаборатория не справляется с объёмом.",
        "Один из результатов выбивается из нормы. Сильно выбивается. Рекордно.",
    ],
    [
        "📡 Военный спутник запущен. Коды доступа введены. Тепловизор включён.",
        "Инфракрасный профиль пидора зафиксирован. Координаты уточняются...",
        "Цель идентифицирована. Повторяю — цель идентифицирована. Она среди вас.",
    ],
    [
        "🔮 Вопрошаю духов рунета... Ёбаный стыд, кто тут пидор?",
        "Духи ненадолго задумались. Потом переглянулись. Потом засмеялись.",
        "Пелена рассеивается... контуры знакомые... очень знакомые...",
    ],
    [
        "🎰 Крупье тасует карты судьбы. Ставки сделаны. Ставок больше нет.",
        "Барабан крутится... рулетка пидорства набирает обороты...",
        "Шарик замедляется... прыгает... и падает на...",
    ],
    [
        "🤖 ChatGPT, кто тут пидор?",
        "— Я языковая модель и не могу давать оценочных суждений о людях—",
        "Ладно, спрошу у нормальной нейросети. Та ответила сразу.",
    ],
    [
        "🕵️ Детектив Пидоров принял дело в работу.",
        "Улики собраны. Алиби проверены. Все врут, но один врёт особенно нагло.",
        "Дело закрыто. Преступник установлен. Мотив — быть пидором.",
    ],
    [
        "🐓 Стоп. Чую петуха в радиусе 50 метров.",
        "Сигнал усиливается... нос не врёт... перья везде...",
        "Петух обнаружен. Внимание, объявляется пидор дня:",
    ],
    [
        "📊 Провожу научное исследование: кто здесь самый пидор?",
        "Выборка репрезентативна. Погрешность — 0%. Сомнений нет.",
        "Результат опубликован в журнале «Вестник пидорологии». И это —",
    ],
];

const resultPhrases = [
    "🥁 Барабанная дробь... ВЖУХ И ТЫ ПИДОР, ",
    "🐓 Ку-ка-ре-ку! Сегодняшний петух — ",
    "🎪 Дамы и господа, пожалуйста встречайте — ПИДОР ДНЯ: ",
    "🔬 Анализ завершён. Диагноз: пидор обыкновенный, 1 шт. Пациент — ",
    "📋 Протокол подписан. Печать поставлена. Пидор дня официально — ",
    "🌈 Радуга пидорства сегодня освещает именно тебя, ",
    "⚡ Молния пидорства долбанула прямо в голову ",
    "🎯 Ну кто бы сомневался. Пидор дня — конечно же ",
    "📣 Внимание на сервере! Сегодня быть пидором выпало ",
    "🏅 Пидор дня обыкновенный — редкий экземпляр, 1 штука — это ",
    "🎺 Фанфары! Туш! Флаги подняты! Сегодняшний пидор — ",
    "🫵 Стоять! Не двигаться! Вы объявляетесь пидором дня — ",
];

const yearTeasePhrases = [
    [
        "🤔 Ладно, ладно... запускаю поиск пидора года.",
        "Да чё тут искать, если честно. Тут всё видно невооружённым глазом.",
        "Главный пидор этого сервера давно известен. И он это знает.",
    ],
    [
        "📊 Поднимаю статистику за весь год...",
        "Таблица говорит сама за себя. Первая строчка — как мемориальная доска.",
        "Имя одно. Отрыв — космический. Конкурентов — ноль.",
    ],
    [
        "🗂️ Листаю годовое дело...",
        "Страница 1: пидор. Страница 2: пидор. Страница 47: снова пидор.",
        "Дело прочитано. Выводы однозначны. Апелляций не принимается.",
    ],
    [
        "🧐 Провожу независимую экспертизу по итогам года...",
        "Эксперты совещались ровно 0.3 секунды. Консенсус достигнут мгновенно.",
        "Жюри единогласно. Зрители согласны. Даже он сам, наверное, согласен:",
    ],
    [
        "🐓 Петух года... А петух года у нас один. Всегда один.",
        "Остальные участники — статисты. Добросовестные, но статисты.",
        "Корона пидорства лежала и ждала весь год. Хозяин нашёлся:",
    ],
];

const yearWinnerPhrases = [
    "👑 ПИДОР ГОДА — без интриг, без сюрпризов — это, конечно же, ",
    "🏆 Год прошёл. Итоги подведены. Петух года среди нас, и это — ",
    "🎖️ Орден «Пидор Года» первой степени с кисточками торжественно вручается — ",
    "📜 История запишет это имя. Пидор года, чемпион, рекордсмен — ",
    "🌈 Флаг поднят. Гимн играет. Главный пидор этого года — ",
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

    async Tease(channel) {
        const phrases = Misc.GetRandomElement(teasePhrases);
        await Misc.AsyncForEach(phrases, async (p) => {
            await Misc.Sleep(2500 + Math.random() * 5500).then(() => {
                channel.send(p);
            });
        });
        await Misc.Sleep(3500 + Math.random() * 2500);
    }

    async TeaseYear(channel) {
        const phrases = Misc.GetRandomElement(yearTeasePhrases);
        await Misc.AsyncForEach(phrases, async (p) => {
            await Misc.Sleep(2000 + Math.random() * 4000).then(() => {
                channel.send(p);
            });
        });
        await Misc.Sleep(2500 + Math.random() * 2000);
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
                resolve(
                    Misc.GetRandomElement(resultPhrases) + "<@" + participant.discord_user_id + "> 🏆"
                );
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
                        `🎊 Поздравляем <@${row.discord_user_id}>! **${row.score}** раз за год — это не невезение, это талант. Редкий. Специфический. Но талант. Носи корону! 👑`,
                        `🐓 <@${row.discord_user_id}>, ты не просто пидор дня. Ты пидор ГОДА. Целого года. **${row.score}** подтверждений. Это статистика, её не оспоришь. Ку-ка-ре-ку! 🎺`,
                        `🫡 <@${row.discord_user_id}> — пидор в хорошем смысле этого слова. И в плохом. И во всех остальных тоже. **${row.score}** раз — рекорд сервера. Легенда.`,
                        `🌈 Год прожит не зря. <@${row.discord_user_id}> набрал **${row.score}** очков пидорства и уходит в историю. Пусть следующий год принесёт ему что-нибудь другое. Хотя вряд ли. 😏`,
                        `📜 Летопись сервера пополнилась. <@${row.discord_user_id}>, **${row.score}** раз — это не случайность. Это судьба. Вселенная просто указала на тебя пальцем. Много раз. 👆`,
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

    ResetScores(guild_id) {
        return new Promise((resolve) => {
            this.dbAdapter.run(
                "UPDATE participants SET score = 0 WHERE discord_guild_id = ?1",
                { 1: guild_id }
            );
            this.dbAdapter.run(
                "DELETE FROM games WHERE discord_guild_id = ?1",
                { 1: guild_id }
            );
            resolve("✅ Статистика обнулена! Новый год — новые пидоры. Начинаем с чистого листа 🗑️");
        });
    }

    async SaveYearWinnerAndReset(guild_id, user_id, user_name, score, year) {
        // Сохраняем победителя в архив
        this.dbAdapter.run(
            "INSERT INTO year_winners (discord_guild_id, discord_user_id, discord_user_name, year, score, datetime) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            { 1: guild_id, 2: user_id, 3: user_name, 4: year, 5: score, 6: Math.floor(Date.now() / 1000) }
        );
        // Сбрасываем статистику и историю игр
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
        // Получаем текущее время если есть
        const current = await this.dbAdapter.get(
            "SELECT auto_time FROM guild_settings WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
        const time = current ? current.auto_time : "09:00";
        this.dbAdapter.run("DELETE FROM guild_settings WHERE discord_guild_id = ?1", { 1: guild_id });
        this.dbAdapter.run(
            "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, ?2, ?3)",
            { 1: guild_id, 2: channel_id, 3: time }
        );
    }

    async SetAutoTime(guild_id, time) {
        // Получаем текущий канал если есть
        const current = await this.dbAdapter.get(
            "SELECT auto_channel_id FROM guild_settings WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
        if (!current) {
            // Нет записи — создаём без канала, но время запомним
            this.dbAdapter.run(
                "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, NULL, ?2)",
                { 1: guild_id, 2: time }
            );
        } else {
            this.dbAdapter.run("DELETE FROM guild_settings WHERE discord_guild_id = ?1", { 1: guild_id });
            this.dbAdapter.run(
                "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, ?2, ?3)",
                { 1: guild_id, 2: current.auto_channel_id, 3: time }
            );
        }
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
        this.dbAdapter.run(
            "DELETE FROM guild_settings WHERE discord_guild_id = ?1",
            { 1: guild_id }
        );
        this.dbAdapter.run(
            "INSERT INTO guild_settings (discord_guild_id, auto_channel_id, auto_time) VALUES (?1, ?2, '09:00')",
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
}

module.exports = Game;
