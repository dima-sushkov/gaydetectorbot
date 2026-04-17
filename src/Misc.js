module.exports = {
    GetRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    Sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async AsyncForEach(array, callback) {
        for (let i = 0; i < array.length; i++) {
            await callback(array[i], i, array);
        }
    },
};
