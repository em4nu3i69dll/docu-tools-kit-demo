import LZWEncoderModule from './LZWEncoder.js';
import NeuQuantModule from './NeuQuant.js';

const LZWEncoder = LZWEncoderModule;
const NeuQuant = NeuQuantModule;

const GIFEncoder = function() {
    const chr = {};
    for (let i = 0; i < 256; i++) {
        chr[i] = String.fromCharCode(i);
    }

    function ByteArray() {
        this.bin = [];
    }

    ByteArray.prototype.getData = function() {
        let v = '';
        const l = this.bin.length;
        for (let i = 0; i < l; i++) {
            v += chr[this.bin[i]];
        }
        return v;
    };

    ByteArray.prototype.writeByte = function(val) {
        this.bin.push(val);
    };

    ByteArray.prototype.writeUTFBytes = function(string) {
        for (let l = string.length, i = 0; i < l; i++) {
            this.writeByte(string.charCodeAt(i));
        }
    };

    ByteArray.prototype.writeBytes = function(array, offset, length) {
        for (let l = length || array.length, i = offset || 0; i < l; i++) {
            this.writeByte(array[i]);
        }
    };

    var exports = {};
    var width;
    var height;
    var transparent = null;
    var transIndex;
    var repeat = -1;
    var delay = 0;
    var started = false;
    var out;
    var image;
    var pixels;
    var indexedPixels;
    var colorDepth;
    var colorTab;
    var usedEntry = [];
    var palSize = 7;
    var dispose = -1;
    var closeStream = false;
    var firstFrame = true;
    var sizeSet = false;
    var sample = 10;
    var comment = "";

    const setDelay = exports.setDelay = function setDelay(ms) {
        delay = Math.round(ms / 10);
    };

    const setDispose = exports.setDispose = function setDispose(code) {
        if (code >= 0) {
            dispose = code;
        }
    };

    const setRepeat = exports.setRepeat = function setRepeat(iter) {
        if (iter >= 0) repeat = iter;
    };

    const setTransparent = exports.setTransparent = function setTransparent(c) {
        transparent = c;
    };

    const setComment = exports.setComment = function setComment(c) {
        comment = c;
    };

    const addFrame = exports.addFrame = function addFrame(im, is_imageData) {
        if ((im === null) || !started || out === null) {
            throw new Error("Please call start method before calling addFrame");
        }
        try {
            if (!is_imageData) {
                image = im.getImageData(0, 0, im.canvas.width, im.canvas.height).data;
                if (!sizeSet) {
                    setSize(im.canvas.width, im.canvas.height);
                }
            } else {
                if(im instanceof ImageData) {
                    if (!sizeSet) {
                        setSize(im.width, im.height);
                    } else if (width != im.width || height != im.height) {
                        throw new Error(`Dimension mismatch: encoder is ${width}x${height}, ImageData is ${im.width}x${im.height}`);
                    }
                    image = im.data;
                } else if(im instanceof Uint8ClampedArray) {
                    if(im.length==(width*height*4)) {
                        image=im;
                    } else {
                        throw new Error(`Uint8ClampedArray length mismatch: expected ${width*height*4}, got ${im.length}`);
                    }
                } else {
                    throw new Error(`Invalid image data type: expected ImageData or Uint8ClampedArray, got ${typeof im}`);
                }
            }
            getImagePixels();
            analyzePixels();
            if (firstFrame) {
                writeLSD();
                writePalette();
                if (repeat >= 0) {
                    writeNetscapeExt();
                }
            }
            writeGraphicCtrlExt();
            if (comment !== '') {
                writeCommentExt();
            }
            writeImageDesc();
            if (!firstFrame) writePalette();
            writePixels();
            firstFrame = false;
            return true;
        } catch (e) {
            console.error('Error in addFrame:', e);
            throw e;
        }
    };

    const finish = exports.finish = function finish() {
        if (!started) return false;
        let ok = true;
        started = false;
        try {
            out.writeByte(0x3b);
            closeStream=true;
        } catch (e) {
            ok = false;
        }
        return ok;
    };

    const reset = function reset() {
        transIndex = 0;
        image = null;
        pixels = null;
        indexedPixels = null;
        colorTab = null;
        closeStream = false;
        firstFrame = true;
    };

    const setFrameRate = exports.setFrameRate = function setFrameRate(fps) {
        if (fps != 0xf) delay = Math.round(100 / fps);
    };

    const setQuality = exports.setQuality = function setQuality(quality) {
        if (quality < 1) quality = 1;
        sample = quality;
    };

    const setSize = exports.setSize = function setSize(w, h) {
        if (started && !firstFrame) return;
        width = w;
        height = h;
        if (width < 1) width = 320;
        if (height < 1) height = 240;
        sizeSet = true;
    };

    const start = exports.start = function start() {
        reset();
        let ok = true;
        closeStream = false;
        out = new ByteArray();
        try {
            out.writeUTFBytes("GIF89a");
        } catch (e) {
            ok = false;
        }
        return started = ok;
    };

    const analyzePixels = function analyzePixels() {
        let len = pixels.length;
        let nPix = len / 3;
        indexedPixels = [];
        let nqModule = NeuQuant();
        if (!nqModule || !nqModule.NeuQuant) {
            throw new Error('NeuQuant module no está disponible');
        }
        nqModule.NeuQuant(pixels, len, sample);
        if (typeof nqModule.process !== 'function') {
            throw new Error('process no está disponible en el módulo NeuQuant');
        }
        colorTab = nqModule.process();
        let k = 0;
        for (let j = 0; j < nPix; j++) {
            let index = nqModule.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
            usedEntry[index] = true;
            indexedPixels[j] = index;
        }
        pixels = null;
        colorDepth = 8;
        palSize = 7;
        if (transparent !== null) {
            transIndex = findClosest(transparent);
        }
    };

    const findClosest = function findClosest(c) {
        if (colorTab === null) return -1;
        let r = (c & 0xFF0000) >> 16;
        let g = (c & 0x00FF00) >> 8;
        let b = (c & 0x0000FF);
        let minpos = 0;
        let dmin = 256 * 256 * 256;
        let len = colorTab.length;
        for (let i = 0; i < len;) {
            let dr = r - (colorTab[i++] & 0xff);
            let dg = g - (colorTab[i++] & 0xff);
            let db = b - (colorTab[i] & 0xff);
            let d = dr * dr + dg * dg + db * db;
            let index = i / 3;
            if (usedEntry[index] && (d < dmin)) {
                dmin = d;
                minpos = index;
            }
            i++;
        }
        return minpos;
    };

    const getImagePixels = function getImagePixels() {
        let w = width;
        let h = height;
        pixels = [];
        let data = image;
        let count = 0;
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                let b = (i * w * 4) + j * 4;
                pixels[count++] = data[b];
                pixels[count++] = data[b + 1];
                pixels[count++] = data[b + 2];
            }
        }
    };

    const writeGraphicCtrlExt = function writeGraphicCtrlExt() {
        out.writeByte(0x21);
        out.writeByte(0xf9);
        out.writeByte(4);
        let transp;
        let disp;
        if (transparent === null) {
            transp = 0;
            disp = 0;
        } else {
            transp = 1;
            disp = 2;
        }
        if (dispose >= 0) {
            disp = dispose & 7;
        }
        disp <<= 2;
        out.writeByte(0 | disp | 0 | transp);
        WriteShort(delay);
        out.writeByte(transIndex);
        out.writeByte(0);
    };

    const writeCommentExt = function writeCommentExt() {
        out.writeByte(0x21);
        out.writeByte(0xfe);
        out.writeByte(comment.length);
        out.writeUTFBytes(comment);
        out.writeByte(0);
    };

    const writeImageDesc = function writeImageDesc() {
        out.writeByte(0x2c);
        WriteShort(0);
        WriteShort(0);
        WriteShort(width);
        WriteShort(height);
        if (firstFrame) {
            out.writeByte(0);
        } else {
            out.writeByte(0x80 | 0 | 0 | 0 | palSize);
        }
    };

    const writeLSD = function writeLSD() {
        WriteShort(width);
        WriteShort(height);
        out.writeByte((0x80 | 0x70 | 0x00 | palSize));
        out.writeByte(0);
        out.writeByte(0);
    };

    const writeNetscapeExt = function writeNetscapeExt() {
        out.writeByte(0x21);
        out.writeByte(0xff);
        out.writeByte(11);
        out.writeUTFBytes("NETSCAPE" + "2.0");
        out.writeByte(3);
        out.writeByte(1);
        WriteShort(repeat);
        out.writeByte(0);
    };

    const writePalette = function writePalette() {
        out.writeBytes(colorTab);
        var n = (3 * 256) - colorTab.length;
        for (var i = 0; i < n; i++) out.writeByte(0);
    };

    const WriteShort = function WriteShort(pValue) {
        out.writeByte(pValue & 0xFF);
        out.writeByte((pValue >> 8) & 0xFF);
    };

    const writePixels = function writePixels() {
        var lzwModule = LZWEncoder();
        if (!lzwModule || !lzwModule.LZWEncoder || !lzwModule.encode) {
            throw new Error('LZWEncoder module no está disponible o no tiene los métodos necesarios');
        }
        lzwModule.LZWEncoder(width, height, indexedPixels, colorDepth);
        lzwModule.encode(out);
    };

    const stream = exports.stream = function stream() {
        return out;
    };

    return exports;
};

export default GIFEncoder;
