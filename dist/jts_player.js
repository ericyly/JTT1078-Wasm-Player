function JtsPlayer() {
    this.canvas = null;
    this.offCanvas = null;
    this.ctx = null;
    this.audioCtx = null;
    this.gainNode = null;
    this.playAudio = false;
    this.nxtAudioPts = 0;
    this.logger = new Logger("jts player");
    this.initPlayer();
}

JtsPlayer.prototype.playAudioFrame = function (audioMsg) {
    const curTime = this.audioCtx.currentTime;
    const startTime = this.nxtAudioPts > curTime ? this.nxtAudioPts : curTime;
    const audioBuf = this.audioCtx.createBuffer(1, audioMsg.buf.length, audioMsg.sampleRate);
    this.nxtAudioPts = curTime > this.nxtAudioPts ? curTime + audioBuf.duration : this.nxtAudioPts + audioBuf.duration;
    audioBuf.copyToChannel(audioMsg.buf, 0);
    const audioSource = this.audioCtx.createBufferSource();
    audioSource.buffer = audioBuf;
    audioSource.connect(this.gainNode);
    audioSource.start(startTime);
}

JtsPlayer.prototype.initPlayer = function () {
    this.decodeWorker = new Worker("decode_worker.js");
    this.decodeWorker.onmessage = (event) => {
        const resMsg = event.data;
        switch (resMsg.type) {
            case jtsAudioFrameOutputMsg:
                if (this.playAudio)
                    this.playAudioFrame(resMsg);
                break;
        }
    }
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.audioCtx.destination);
}

JtsPlayer.prototype.openAudio = function () {
    this.playAudio = true;
}

JtsPlayer.prototype.closeAudio = function () {
    this.playAudio = false;
}

JtsPlayer.prototype.play = function (url, canvas, playAudio) {
    this.logger.info(`web socket=${url}.`);
    this.playAudio = playAudio;
    if (!url || !canvas) {
        this.logger.error("[ER] play error, url or canvas empty.");
        return;
    }

    if (!this.decodeWorker) {
        this.logger.error("[ER] stream decoder not initialized.");
        return;
    }

    this.canvas = canvas;
    this.offCanvas = canvas.transferControlToOffscreen();

    this.decodeWorker.postMessage({
        type: jtsInitDecoderReqMsg,
        vedioType: "h264",
        audioType: "aac"
    });
    this.decodeWorker.postMessage({
        type: jtsChangeCanvasSizeReqMsg,
        w: canvas.width,
        h: canvas.height,
        canvas: this.offCanvas
    }, [this.offCanvas]);
    this.decodeWorker.postMessage({
        type: jtsStartRtpStreamReqMsg,
        url: url
    });
}

JtsPlayer.prototype.stop = function () {
    if(this.audioCtx != null) this.audioCtx.close();
    this.decodeWorker.postMessage({type: jtsUninitDecoderReqMsg});
    this.decodeWorker.terminate();
}
