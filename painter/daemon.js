const { existsSync } = require('fs');

const
    Koa = require('koa'),
    api = require('./api'),
    { sleep, shuffle } = require('./util'),
    page = require('fs').readFileSync(require('path').resolve(__dirname, 'view.html')).toString();

async function getTasks(image, x, y) {
    const board = (await api.getBoard()).split('\n').map(i => i.split(''));
    let tasks = [];
    for (let i = 0; i < image.length; ++i)
        for (let j = 0; j < image[0].length; ++j) {
            if (parseInt(board[j + x][i + y], 32) !== image[i][j])
                tasks.push({
                    color: image[i][j],
                    x: j + x,
                    y: i + y,
                });
        }
    return shuffle(tasks);
}

async function daemon(config) {
    const app = new Koa();
    let users = [];
    if (existsSync(__dirname + '/../users.json')) users = require('../users.json');
    let tasks = [];
    let image = require('../' + config.path);

    app.use(async ctx => {
        if (ctx.query.token) {
            users.push({ token: ctx.query.token, lastPaintTime: 0, fail: 0 })
            console.log(`Session add, current ${users.length}`);
            ctx.body = 'success';
        } else {
            ctx.body = page;
        }
    })

    app.listen(9999);
    tasks = await getTasks(image, config.x, config.y);
    process.on('SIGINT', () => {
        require('fs').writeFileSync('./users.json', JSON.stringify(users));
        process.exit(0);
    })

    while (true) {
        while (!tasks.length) {
            await sleep(10000);
            tasks = await getTasks(image, config.x, config.y);
        }
        while (!users.length) await sleep(1000);
        if (Date.now() - users[0].lastPaintTime <= api.delay)
            await sleep(api.delay - (Date.now() - users[0].lastPaintTime));
        console.log(users[0].token.split(':')[0], tasks[0]);
        let res = await api.paint(users[0].token, tasks[0]);
        users[0].lastPaintTime = Date.now();
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
                console.log(`Session invalid, current ${users.length}`);
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