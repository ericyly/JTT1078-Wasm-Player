self.Module = {
    onRuntimeInitialized: function () {
        onWasmLoaded();
    }
};

self.importScripts("common.js");
self.importScripts("stream_decoder.js");

function DecodeWorker() {
    this.logger = new Logger("decoder worker");
    this.coreLogLevel = 1;
    this.wasmLoaded = false;
    this.tmpReqMsgQue = [];
    this.videoFrameCallback = null;
    this.audioFrameCallback = null;
    this.canvas = null;
    this.ctx = null;
    this.gotFrame = false;
}

DecodeWorker.prototype.initDecoder = function (vedioType, audioType) {
    const ret = Module._initDecoder(this.videoFrameCallback, this.audioFrameCallback,
        allocateUTF8(vedioType), allocateUTF8(audioType), this.coreLogLevel);
    this.logger.info("init stream decoder ret = " + ret + ".");
}

DecodeWorker.prototype.uninitDecoder = function () {
    const ret = Module._uninitDecoder();
    // this.logger.info("uninit stream decoder ret = " + ret);
}

DecodeWorker.prototype.startRTPStream = function (url) {
    this.logger.info("start rtp stream");
    Module._startRTPStream(allocateUTF8(url));
}

DecodeWorker.prototype.changeFrameSize = function (width, height) {
    Module._changeFrameSize(width, height);
}

DecodeWorker.prototype.processReq = function (reqMsg) {
    switch (reqMsg.type) {
        case jtsInitDecoderReqMsg:
            this.initDecoder(reqMsg.vedioType, reqMsg.audioType);
            break;
        case jtsUninitDecoderReqMsg:
            this.uninitDecoder();
            break;
        case jtsStartRtpStreamReqMsg:
            this.startRTPStream(reqMsg.url);
            break;
        case jtsChangeCanvasSizeReqMsg:
            this.changeFrameSize(reqMsg.w, reqMsg.h);
            this.canvas = reqMsg.canvas;
            this.ctx = this.canvas.getContext('2d');
            break;
        default:
            this.logger.error("decoder worker unsupport messsage " + reqMsg.type);
    }
}

DecodeWorker.prototype.onWasmLoaded = function () {
    this.logger.info("Wasm loaded.");
    this.wasmLoaded = true;
    this.videoFrameCallback = Module.addFunction((buff, size, width, height) => {
        const outArray = Module.HEAPU8.subarray(buff, buff + size);
        const imgData = new ImageData(new Uint8ClampedArray(outArray, 0, size), width, height);
        this.ctx.putImageData(imgData, 0, 0, 0, 0, width, height);
        // if(!this.gotFrame){
        //     this.logger.info("first frame got!");
        //     this.gotFrame = true;
        // }
    }, 'viiii');

    this.audioFrameCallback = Module.addFunction((buff, size, sampleRate) => {
        const outArray = Module.HEAPU8.subarray(buff, buff + size);
        const data = new Uint8Array(outArray);
        const data16 = new Int16Array(data.buffer);
        const floatBuf = new Float32Array(data16.length);
        data16.forEach((v, ind) => {
            floatBuf[ind] = v / 32768;
        });
        const resMsg = {
            type: jtsAudioFrameOutputMsg,
            buf: floatBuf,
            sampleRate: sampleRate
        };
        self.postMessage(resMsg, [resMsg.buf.buffer]);
    }, 'viii');

    while (this.tmpReqMsgQue.length > 0) {
        const reqMsg = this.tmpReqMsgQue.shift();
        this.processReq(reqMsg);
    }
}

self.worker = new DecodeWorker;

self.onmessage = function (ev) {
    if (!self.worker) {
        console.log("[ER] stream decoder not initialized!");
        return;
    }

    const reqMsg = ev.data;
    if (!self.worker.wasmLoaded) {
        self.worker.tmpReqMsgQue.push(reqMsg);
        return;
    }

    self.worker.processReq(reqMsg);
}

function onWasmLoaded() {
    if (self.worker) {
        self.worker.onWasmLoaded();
    } else {
        console.log("[ER] stream decoder not exists!");
    }
}
