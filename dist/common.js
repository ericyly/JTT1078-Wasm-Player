//request message to decoder worker
const jtsInitDecoderReqMsg = 0;
const jtsUninitDecoderReqMsg = 1;
const jtsStartRtpStreamReqMsg = 2;
const jtsChangeCanvasSizeReqMsg = 3;

//decoder worker's response message
const jtsAudioFrameOutputMsg = 0;

function Logger(module) {
    this.module = module;
}

Logger.prototype.log = function (line) {
    console.log(this.curTimeStr() + "[" + this.module + "]" + line);
}

Logger.prototype.error = function (line) {
    console.log(this.curTimeStr() + " [Er][" + this.module + "] " + line);
}

Logger.prototype.info = function (line) {
    console.log(this.curTimeStr() + " [If][" + this.module + "] " + line);
}

Logger.prototype.debug = function (line) {
    console.log(this.curTimeStr() + " [Db][" + this.module + "] " + line);
}

Logger.prototype.curTimeStr = function () {
    const now = new Date(Date.now());
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const sec = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds();
    return `${year}-${month}-${day} ${hour}:${min}:${sec}:${ms}`;
}

