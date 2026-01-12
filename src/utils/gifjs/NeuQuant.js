const NeuQuant = function() {
    var exports = {};
    var netsize = 256;

    var prime1 = 499;
    var prime2 = 491;
    var prime3 = 487;
    var prime4 = 503;
    var minpicturebytes = (3 * prime4);

    var maxnetpos = (netsize - 1);
    var netbiasshift = 4;
    var ncycles = 100;

    var intbiasshift = 16;
    var intbias = (1 << intbiasshift);
    var gammashift = 10;
    var gamma = (1 << gammashift);
    var betashift = 10;
    var beta = (intbias >> betashift);
    var betagamma = (intbias << (gammashift - betashift));

    var initrad = (netsize >> 3);
    var radiusbiasshift = 6;
    var radiusbias = (1 << radiusbiasshift);
    var initradius = (initrad * radiusbias);
    var radiusdec = 30;

    var alphabiasshift = 10;
    var initalpha = (1 << alphabiasshift);
    var alphadec;

    var radbiasshift = 8;
    var radbias = (1 << radbiasshift);
    var alpharadbshift = (alphabiasshift + radbiasshift);
    var alpharadbias = (1 << alpharadbshift);

    var thepicture;
    var lengthcount;
    var samplefac;

    var network;
    var netindex = [];
    var bias = [];
    var freq = [];
    var radpower = [];

    const NeuQuant = exports.NeuQuant = function NeuQuant(thepic, len, sample) {
        let i;
        let p;
        thepicture = thepic;
        lengthcount = len;
        samplefac = sample;
        network = new Array(netsize);
        for (i = 0; i < netsize; i++) {
            network[i] = new Array(4);
            p = network[i];
            p[0] = p[1] = p[2] = (i << (netbiasshift + 8)) / netsize;
            freq[i] = intbias / netsize;
            bias[i] = 0;
        }
    };

    const colorMap = function colorMap() {
        let map = [];
        let index = new Array(netsize);
        for (let i = 0; i < netsize; i++) {
            index[network[i][3]] = i;
        }
        let k = 0;
        for (let l = 0; l < netsize; l++) {
            let j = index[l];
            map[k++] = (network[j][0]);
            map[k++] = (network[j][1]);
            map[k++] = (network[j][2]);
        }
        return map;
    };

    const inxbuild = function inxbuild() {
        let i;
        let j;
        let smallpos;
        let smallval;
        let p;
        let q;
        var previouscol;
        let startpos;
        previouscol = 0;
        startpos = 0;
        for (i = 0; i < netsize; i++) {
            p = network[i];
            smallpos = i;
            smallval = p[1];
            for (j = i + 1; j < netsize; j++) {
                q = network[j];
                if (q[1] < smallval) {
                    smallpos = j;
                    smallval = q[1];
                }
            }
            q = network[smallpos];
            if (i != smallpos) {
                j = q[0];
                q[0] = p[0];
                p[0] = j;
                j = q[1];
                q[1] = p[1];
                p[1] = j;
                j = q[2];
                q[2] = p[2];
                p[2] = j;
                j = q[3];
                q[3] = p[3];
                p[3] = j;
            }
            if (smallval != previouscol) {
                netindex[previouscol] = (startpos + i) >> 1;
                for (j = previouscol + 1; j < smallval; j++) netindex[j] = i;
                previouscol = smallval;
                startpos = i;
            }
        }
        netindex[previouscol] = (startpos + maxnetpos) >> 1;
        for (j = previouscol + 1; j < 256; j++) netindex[j] = maxnetpos;
    };

    const learn = function learn() {
        let i;
        let j;
        let b;
        let g;
        let r;
        let radius;
        let rad;
        let alpha;
        let step;
        let delta;
        let samplepixels;
        let p;
        let pix;
        let lim;

        if (lengthcount < minpicturebytes) samplefac = 1;
        alphadec = 30 + ((samplefac - 1) / 3);
        p = thepicture;
        pix = 0;
        lim = lengthcount;
        samplepixels = lengthcount / (3 * samplefac);
        delta = (samplepixels / ncycles) | 0;
        alpha = initalpha;
        radius = initradius;
        rad = radius >> radiusbiasshift;
        if (rad <= 1) rad = 0;
        for (i = 0; i < rad; i++) radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));

        if (lengthcount < minpicturebytes) step = 3;
        else if ((lengthcount % prime1) !== 0) step = 3 * prime1;
        else {
            if ((lengthcount % prime2) !== 0) step = 3 * prime2;
            else {
                if ((lengthcount % prime3) !== 0) step = 3 * prime3;
                else step = 3 * prime4;
            }
        }

        i = 0;
        while (i < samplepixels) {
            b = (p[pix + 0] & 0xff) << netbiasshift;
            g = (p[pix + 1] & 0xff) << netbiasshift;
            r = (p[pix + 2] & 0xff) << netbiasshift;
            j = contest(b, g, r);
            altersingle(alpha, j, b, g, r);
            if (rad !== 0) alterneigh(rad, j, b, g, r);
            pix += step;
            if (pix >= lim) pix -= lengthcount;
            i++;
            if (delta === 0) delta = 1;
            if (i % delta === 0) {
                alpha -= alpha / alphadec;
                radius -= radius / radiusdec;
                rad = radius >> radiusbiasshift;
                if (rad <= 1) rad = 0;
                for (j = 0; j < rad; j++) radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
            }
        }
    };

    const map = exports.map = function map(b, g, r) {
        let i;
        let j;
        let dist;
        let a;
        let bestd;
        let p;
        let best;
        bestd = 1000;
        best = -1;
        i = netindex[g];
        j = i - 1;
        while ((i < netsize) || (j >= 0)) {
            if (i < netsize) {
                p = network[i];
                dist = p[1] - g;
                if (dist >= bestd) i = netsize;
                else {
                    i++;
                    if (dist < 0) dist = -dist;
                    a = p[0] - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
            if (j >= 0) {
                p = network[j];
                dist = g - p[1];
                if (dist >= bestd) j = -1;
                else {
                    j--;
                    if (dist < 0) dist = -dist;
                    a = p[0] - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
        }
        return (best);
    };

    const process = exports.process = function process() {
        learn();
        unbiasnet();
        inxbuild();
        return colorMap();
    };

    const unbiasnet = function unbiasnet() {
        let i;
        let j;
        for (i = 0; i < netsize; i++) {
            network[i][0] >>= netbiasshift;
            network[i][1] >>= netbiasshift;
            network[i][2] >>= netbiasshift;
            network[i][3] = i;
        }
    };

    const alterneigh = function alterneigh(rad, i, b, g, r) {
        let j;
        let k;
        let lo;
        let hi;
        let a;
        let m;
        let p;
        lo = i - rad;
        if (lo < -1) lo = -1;
        hi = i + rad;
        if (hi > netsize) hi = netsize;
        j = i + 1;
        k = i - 1;
        m = 1;
        while ((j < hi) || (k > lo)) {
            a = radpower[m++];
            if (j < hi) {
                p = network[j++];
                try {
                    p[0] -= (a * (p[0] - b)) / alpharadbias;
                    p[1] -= (a * (p[1] - g)) / alpharadbias;
                    p[2] -= (a * (p[2] - r)) / alpharadbias;
                } catch (e) {}
            }
            if (k > lo) {
                p = network[k--];
                try {
                    p[0] -= (a * (p[0] - b)) / alpharadbias;
                    p[1] -= (a * (p[1] - g)) / alpharadbias;
                    p[2] -= (a * (p[2] - r)) / alpharadbias;
                } catch (e) {}
            }
        }
    };

    const altersingle = function altersingle(alpha, i, b, g, r) {
        let n = network[i];
        n[0] -= (alpha * (n[0] - b)) / initalpha;
        n[1] -= (alpha * (n[1] - g)) / initalpha;
        n[2] -= (alpha * (n[2] - r)) / initalpha;
    };

    const contest = function contest(b, g, r) {
        let i;
        let dist;
        let a;
        let biasdist;
        let betafreq;
        let bestpos;
        let bestbiaspos;
        let bestd;
        let bestbiasd;
        let n;
        bestd = ~ (1 << 31);
        bestbiasd = bestd;
        bestpos = -1;
        bestbiaspos = bestpos;
        for (i = 0; i < netsize; i++) {
            n = network[i];
            dist = n[0] - b;
            if (dist < 0) dist = -dist;
            a = n[1] - g;
            if (a < 0) a = -a;
            dist += a;
            a = n[2] - r;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
                bestd = dist;
                bestpos = i;
            }
            biasdist = dist - ((bias[i]) >> (intbiasshift - netbiasshift));
            if (biasdist < bestbiasd) {
                bestbiasd = biasdist;
                bestbiaspos = i;
            }
            betafreq = (freq[i] >> betashift);
            freq[i] -= betafreq;
            bias[i] += (betafreq << gammashift);
        }
        freq[bestpos] += beta;
        bias[bestpos] -= betagamma;
        return (bestbiaspos);
    };

    NeuQuant.apply(this, arguments);
    return exports;
};

export default NeuQuant;
