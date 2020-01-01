const fs = require('fs');
class Image {
    constructor(data) {
        const lastLine = data.pop();
        if (lastLine !== "") data.push(lastLine);
        this.data = data;
        this.x = data[0].length;
        this.y = data.length;
    }
}
function readBase32Image(path) {
    const data = fs.readFileSync(path, "utf-8").toString();
    const lines = data.split("\n");
    const res = new Image(lines);
    return res;
}

module.exports = { readBase32Image }