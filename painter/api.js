const axios = require('axios');
async function getBoard() {
    let res = await axios.get('http://www.luogu.com.cn/paintboard/board');
    return res.data;
}
async function paint(token, task) {
    task.color = parseInt(task.color, 32);
    let result = await axios.post('http://www.luogu.com.cn/paintboard/paint?token=' + token, task);
    return result;
}
module.exports = { getBoard, paint, delay: 30010 }