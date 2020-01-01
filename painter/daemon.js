const
    koa = require('koa'),
    api = require('./api'),
    { sleep } = require('./util'),
    page = require('fs').readFileSync(require('path').resolve(__dirname, 'view.html')).toString(),
    { readBase32Image } = require('./image');
async function getTasks(image, x, y) {
    const board = await api.getBoard();
    let tasks = [];
    for (let i = 0; i < image.y; ++i)
        for (let j = 0; j < image.x; ++j)
            if (board[j + x][i + y] !== image.data[i][j])
                tasks.push({
                    color: image.data[i][j],
                    x: j + x,
                    y: i + y,
                });
    return tasks;
}
async function daemon(config) {
    const app = new koa();
    let users = [];
    let tasks = [];
    let image = readBase32Image(config.path);
    app.use(async ctx => {
        if (ctx.query.cookie) {
            users.push({ cookie: ctx.query.cookie, lastPaintTime: 0, fail: 0 })
            console.log(`Session add, current ${users.length}`);
            ctx.body = 'success';
        } else {
            ctx.body = page;
        }
    })
    app.listen(9999);
    tasks = await getTasks(image, config.x, config.y);
    process.on('SIGINT', () => {
        require('fs').writeFileSync('./users', JSON.stringify(users));
        process.exit(0);
    })
    while (true) {
        while (!tasks.length) {
            await sleep(1000);
            tasks = await getTasks(image, config.x, config.y);
        }
        while (!users.length) {
            await sleep(1000);
        }
        if (new Date().getTime() - users[0].lastPaintTime <= api.delay)
            await sleep(api.delay - (new Date().getTime() - users[0].lastPaintTime));
        let res = await api.paint(users[0].cookie, tasks[0]);
        users[0].lastPaintTime = new Date().getTime();
        if (res.status == 200) {
            users[0].fail = 0;
            users.push(users.shift());
            tasks.shift();
        } else if (res.status == 401)
            users.shift();
        else {
            users[0].fail++;
            if (users[0].fail < 3) users.push(users.shift());
            else {
                users.shift();
                console.log(`Session invalidate, current ${users.length}`);
            }
        }
        console.log(`${tasks.length} left.`);
    }
}
if (!module.parent) {
    let config = require('../config.json');
    daemon(config).catch(e => {
        console.error(e);
        process.exit(1);
    });
} else module.exports = daemon;