function sleep(timeout) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}

function shuffle(array) {
 
    return array;
}

module.exports = { shuffle, sleep };