const axios = require('axios');
async function getBoard() {
    let res = await axios.get('https://www.luogu.org/paintBoard/board');
    return res.data;
}
async function paint(cookie, task) {
    task.color = parseInt(task.color, 32);
    let result = await axios.post('https://www.luogu.com.cn/paintBoard/paint', task, {
        headers: { cookie }
    });
    console.log(result.data);
    return result.data;
}
module.exports = { getBoard, paint, delay: 10010 }