/**
 * Goods Tracker - Barcode & QR Code Engine (100% Offline, Zero-Dependency)
 * Encodes standard Code 128 (Type B) Barcodes into sharp, scalable SVG
 * Encodes standard 2D QR Codes (Model 2, Byte Mode, ISO/IEC 18004) into scalable SVG
 * Includes Hardware Scanner Burst Simulator & Kedmanee Thai-to-English Translation
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Code 128 (Subset B) 1D Barcode Generator
  // ==========================================================================
  const CODE128_PATTERNS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106
  ];

  function generateBarcodeSVG(rawText, options = {}) {
    const text = String(rawText || '').trim();
    if (!text) return '<svg width="100" height="40"><text x="10" y="25" fill="#999">No Data</text></svg>';

    const height = options.height || 68;
    const barWidth = options.barWidth || 2;
    const showText = options.showText !== false;
    const fontSize = options.fontSize || 13;

    // Code 128 Subset B: Start B is index 104
    const codes = [104];
    let checksum = 104;

    for (let i = 0; i < text.length; i++) {
      const ascii = text.charCodeAt(i);
      const code = (ascii >= 32 && ascii <= 126) ? (ascii - 32) : 0;
      codes.push(code);
      checksum += code * (i + 1);
    }

    codes.push(checksum % 103);
    codes.push(106); // Stop Code

    let patternStr = '';
    for (let i = 0; i < codes.length; i++) {
      patternStr += CODE128_PATTERNS[codes[i]];
    }

    const quietModules = 10;
    let totalModules = quietModules * 2;
    for (let i = 0; i < patternStr.length; i++) {
      totalModules += parseInt(patternStr[i], 10);
    }

    const svgWidth = totalModules * barWidth;
    const svgHeight = showText ? height + fontSize + 14 : height + 8;

    let x = quietModules * barWidth;
    let isBar = true;
    let rects = '';

    for (let i = 0; i < patternStr.length; i++) {
      const w = parseInt(patternStr[i], 10) * barWidth;
      if (isBar) {
        rects += `<rect x="${x}" y="4" width="${w}" height="${height}" fill="#000000" />`;
      }
      x += w;
      isBar = !isBar;
    }

    const textSvg = showText
      ? `<text x="${svgWidth / 2}" y="${height + fontSize + 4}" text-anchor="middle" font-family="'Courier New', Courier, monospace" font-size="${fontSize}" font-weight="bold" fill="#1d1d1f" letter-spacing="1.5">${escapeXml(text)}</text>`
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" class="barcode-svg" style="background:#ffffff;border-radius:6px;display:block;max-width:100%;height:auto;"><rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />${rects}${textSvg}</svg>`;
  }

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // ==========================================================================
  // 2. Zero-Dependency 2D QR Code Generator (Model 2, Byte Mode, ISO/IEC 18004)
  // ==========================================================================
  const qrcodeLib = (function () {
    function QR8bitByte(data) {
      this.mode = 4;
      this.data = data;
      this.parsedData = [];
      for (let i = 0; i < this.data.length; i++) {
        const byteArray = [];
        const code = this.data.charCodeAt(i);
        if (code > 0x10000) {
          byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
          byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
          byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
          byteArray[3] = 0x80 | (code & 0x3F);
        } else if (code > 0x800) {
          byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
          byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
          byteArray[2] = 0x80 | (code & 0x3F);
        } else if (code > 0x7F) {
          byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
          byteArray[1] = 0x80 | (code & 0x3F);
        } else {
          byteArray[0] = code;
        }
        this.parsedData.push(byteArray);
      }
      this.parsedData = Array.prototype.concat.apply([], this.parsedData);
    }
    QR8bitByte.prototype = {
      getLength: function () { return this.parsedData.length; },
      write: function (buffer) {
        for (let i = 0; i < this.parsedData.length; i++) buffer.put(this.parsedData[i], 8);
      }
    };

    const QRMath = {
      glog: function (n) { return QRMath.LOG_TABLE[n]; },
      gexp: function (n) {
        while (n < 0) n += 255;
        while (n >= 255) n -= 255;
        return QRMath.EXP_TABLE[n];
      },
      EXP_TABLE: new Array(256),
      LOG_TABLE: new Array(256)
    };
    for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
    for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

    function QRPolynomial(num, shift) {
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
      for (let i = 0; i < shift; i++) this.num[num.length - offset + i] = 0;
    }
    QRPolynomial.prototype = {
      get: function (index) { return this.num[index]; },
      getLength: function () { return this.num.length; },
      multiply: function (e) {
        const num = new Array(this.getLength() + e.getLength() - 1);
        for (let i = 0; i < this.getLength(); i++) {
          for (let j = 0; j < e.getLength(); j++) {
            num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
          }
        }
        return new QRPolynomial(num, 0);
      },
      mod: function (e) {
        if (this.getLength() - e.getLength() < 0) return this;
        const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
        const num = new Array(this.getLength());
        for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
        for (let i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
        return new QRPolynomial(num, 0).mod(e);
      }
    };

    const QRRSBlock = {
      RS_BLOCK_TABLE: [
        [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
        [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
        [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
        [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
        [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
        [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
        [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
        [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
        [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
      ],
      getRSBlocks: function (typeNumber, errorCorrectLevel) {
        const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
        if (rsBlock === undefined) throw new Error('bad rs block @ typeNumber:' + typeNumber);
        const length = rsBlock.length / 3;
        const list = [];
        for (let i = 0; i < length; i++) {
          const count = rsBlock[i * 3 + 0];
          const totalCount = rsBlock[i * 3 + 1];
          const dataCount = rsBlock[i * 3 + 2];
          for (let j = 0; j < count; j++) list.push({ totalCount: totalCount, dataCount: dataCount });
        }
        return list;
      },
      getRsBlockTable: function (typeNumber, errorCorrectLevel) {
        switch (errorCorrectLevel) {
          case 1: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0]; // L
          case 0: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1]; // M
          case 3: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2]; // Q
          case 2: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3]; // H
          default: return undefined;
        }
      }
    };

    function QRBitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    QRBitBuffer.prototype = {
      get: function (index) {
        const bufIndex = Math.floor(index / 8);
        return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
      },
      put: function (num, length) {
        for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      },
      putBit: function (bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) this.buffer.push(0);
        if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        this.length++;
      }
    };

    const QRUtil = {
      PATTERN_POSITION_TABLE: [
        [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
        [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
      ],
      G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
      G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
      getBCHTypeInfo: function (data) {
        let d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
          d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
        }
        return ((data << 10) | d) ^ QRUtil.G15_MASK;
      },
      getBCHDigit: function (data) {
        let digit = 0;
        while (data !== 0) { digit++; data >>>= 1; }
        return digit;
      },
      getPatternPosition: function (typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
      },
      getMask: function (maskPattern, i, j) {
        switch (maskPattern) {
          case 0: return (i + j) % 2 === 0;
          case 1: return i % 2 === 0;
          case 2: return j % 3 === 0;
          case 3: return (i + j) % 3 === 0;
          case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
          case 5: return (i * j) % 2 + (i * j) % 3 === 0;
          case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
          case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
          default: throw new Error('bad maskPattern:' + maskPattern);
        }
      },
      getErrorFactory: function (errorCorrectLength) {
        let a = new QRPolynomial([1], 0);
        for (let i = 0; i < errorCorrectLength; i++) {
          a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        }
        return a;
      },
      getLengthInBits: function (mode, type) {
        if (1 <= type && type < 10) return 8;
        return 16;
      },
      getLostPoint: function (qrCode) {
        const moduleCount = qrCode.getModuleCount();
        let lostPoint = 0;
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            let sameCount = 0;
            const dark = qrCode.isDark(row, col);
            for (let r = -1; r <= 1; r++) {
              if (row + r < 0 || moduleCount <= row + r) continue;
              for (let c = -1; c <= 1; c++) {
                if (col + c < 0 || moduleCount <= col + c) continue;
                if (r === 0 && c === 0) continue;
                if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
              }
            }
            if (sameCount > 5) lostPoint += (3 + sameCount - 5);
          }
        }
        return lostPoint;
      }
    };

    function QRCodeModel(typeNumber, errorCorrectLevel) {
      this.typeNumber = typeNumber;
      this.errorCorrectLevel = errorCorrectLevel;
      this.modules = null;
      this.moduleCount = 0;
      this.dataCache = null;
      this.dataList = [];
    }
    QRCodeModel.prototype = {
      addData: function (data) {
        this.dataList.push(new QR8bitByte(data));
        this.dataCache = null;
      },
      isDark: function (row, col) {
        if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
          throw new Error(row + ',' + col);
        }
        return this.modules[row][col];
      },
      getModuleCount: function () { return this.moduleCount; },
      make: function () {
        if (this.typeNumber < 1) {
          let typeNumber = 1;
          for (typeNumber = 1; typeNumber < 10; typeNumber++) {
            const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
            let totalDataCount = 0;
            for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
            let length = 0;
            for (let i = 0; i < this.dataList.length; i++) length += this.dataList[i].getLength();
            if (length <= totalDataCount - 3) break;
          }
          this.typeNumber = Math.min(typeNumber, 10);
        }
        this.makeImpl(false, this.getBestMaskPattern());
      },
      makeImpl: function (test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);
        for (let row = 0; row < this.moduleCount; row++) {
          this.modules[row] = new Array(this.moduleCount);
          for (let col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
        }
        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);
        if (this.dataCache == null) {
          this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
        }
        this.mapData(this.dataCache, maskPattern);
      },
      setupPositionProbePattern: function (row, col) {
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || this.moduleCount <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || this.moduleCount <= col + c) continue;
            if ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      },
      setupPositionAdjustPattern: function () {
        const pos = QRUtil.getPatternPosition(this.typeNumber);
        for (let i = 0; i < pos.length; i++) {
          for (let j = 0; j < pos.length; j++) {
            const row = pos[i];
            const col = pos[j];
            if (this.modules[row][col] != null) continue;
            for (let r = -2; r <= 2; r++) {
              for (let c = -2; c <= 2; c++) {
                if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                  this.modules[row + r][col + c] = true;
                } else {
                  this.modules[row + r][col + c] = false;
                }
              }
            }
          }
        }
      },
      setupTimingPattern: function () {
        for (let r = 8; r < this.moduleCount - 8; r++) {
          if (this.modules[r][6] != null) continue;
          this.modules[r][6] = (r % 2 === 0);
        }
        for (let c = 8; c < this.moduleCount - 8; c++) {
          if (this.modules[6][c] != null) continue;
          this.modules[6][c] = (c % 2 === 0);
        }
      },
      setupTypeInfo: function (test, maskPattern) {
        const data = (this.errorCorrectLevel << 3) | maskPattern;
        const bits = QRUtil.getBCHTypeInfo(data);
        for (let i = 0; i < 15; i++) {
          const mod = (!test && ((bits >> i) & 1) === 1);
          if (i < 6) this.modules[i][8] = mod;
          else if (i < 8) this.modules[i + 1][8] = mod;
          else this.modules[this.moduleCount - 15 + i][8] = mod;

          if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
          else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
          else this.modules[8][15 - i - 1] = mod;
        }
        this.modules[this.moduleCount - 8][8] = !test;
      },
      mapData: function (data, maskPattern) {
        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
          if (col === 6) col--;
          while (true) {
            for (let c = 0; c < 2; c++) {
              if (this.modules[row][col - c] == null) {
                let dark = false;
                if (byteIndex < data.length) {
                  dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                }
                const mask = QRUtil.getMask(maskPattern, row, col - c);
                if (mask) dark = !dark;
                this.modules[row][col - c] = dark;
                bitIndex--;
                if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
              }
            }
            row += inc;
            if (row < 0 || this.moduleCount <= row) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      },
      getBestMaskPattern: function () {
        let minLostPoint = 0;
        let pattern = 0;
        for (let i = 0; i < 8; i++) {
          this.makeImpl(true, i);
          const lostPoint = QRUtil.getLostPoint(this);
          if (i === 0 || minLostPoint > lostPoint) {
            minLostPoint = lostPoint;
            pattern = i;
          }
        }
        return pattern;
      }
    };

    QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
      const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
      const buffer = new QRBitBuffer();
      for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
        data.write(buffer);
      }
      let totalDataCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.length % 8 !== 0) buffer.putBit(false);
      while (true) {
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0xEC, 8);
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }
      return QRCodeModel.createBytes(buffer, rsBlocks);
    };

    QRCodeModel.createBytes = function (buffer, rsBlocks) {
      let offset = 0;
      let maxDcCount = 0;
      let maxEcCount = 0;
      const dcdata = new Array(rsBlocks.length);
      const ecdata = new Array(rsBlocks.length);
      for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount;
        const ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);
        for (let i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xFF & buffer.buffer[i + offset];
        offset += dcCount;
        const rsPoly = QRUtil.getErrorFactory(ecCount);
        const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        const modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (let i = 0; i < ecdata[r].length; i++) {
          const modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
        }
      }
      const data = [];
      for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) data.push(dcdata[r][i]);
        }
      }
      for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) data.push(ecdata[r][i]);
        }
      }
      return data;
    };

    return function (text, ecLevel = 0) {
      const qr = new QRCodeModel(0, ecLevel);
      qr.addData(text);
      qr.make();
      return qr;
    };
  })();

  /**
   * Generate 2D QR Code SVG
   * @param {string} rawText Alphanumeric text, JSON, or URL
   * @param {object} options { size, margin, title }
   * @returns {string} Scalable SVG XML String
   */
  function generateQRCodeSVG(rawText, options = {}) {
    const text = String(rawText || '').trim();
    if (!text) return '<svg width="100" height="100"><text x="10" y="50" fill="#999">No Data</text></svg>';

    const size = options.size || 160;
    const margin = options.margin !== undefined ? options.margin : 2;
    const title = options.title || '';
    const ecLevel = options.ecLevel || 0; // 0: M, 1: L, 2: H, 3: Q

    const qr = qrcodeLib(text, ecLevel);
    const count = qr.getModuleCount();
    const total = count + margin * 2;
    const moduleSize = 10;
    const viewBoxSize = total * moduleSize;
    const extraBottom = title ? 28 : 0;
    const viewBoxHeight = viewBoxSize + extraBottom;

    let rects = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margin) * moduleSize;
          const y = (r + margin) * moduleSize;
          rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#000000" />`;
        }
      }
    }

    const titleSvg = title
      ? `<text x="${viewBoxSize / 2}" y="${viewBoxSize + 18}" text-anchor="middle" font-family="'SF Pro Text', 'Prompt', sans-serif" font-size="12" font-weight="600" fill="#1d1d1f">${escapeXml(title)}</text>`
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxHeight}" width="${size}" height="${size * (viewBoxHeight / viewBoxSize)}" class="qrcode-svg" style="background:#ffffff;border-radius:8px;display:block;max-width:100%;height:auto;"><rect width="${viewBoxSize}" height="${viewBoxHeight}" fill="#ffffff" rx="8" />${rects}${titleSvg}</svg>`;
  }

  // ==========================================================================
  // 3. Hardware Scanner Burst Simulator
  // ==========================================================================
  function simulateBarcodeScan(barcodeText) {
    if (!barcodeText) return;
    const text = String(barcodeText).trim();

    // If app has registered handleScannedInput, directly invoke for instant execution
    if (typeof window.handleScannedInput === 'function') {
      window.handleScannedInput(text);
      if (window.showToast) {
        window.showToast(`⚡ ยิงสแกนบาร์โค้ด "${text}" สำเร็จ!`, 'zap');
      }
      return;
    }

    // Otherwise dispatch rapid keystroke burst to window
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        const char = text[i];
        const event = new KeyboardEvent('keydown', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(event);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(enterEvent);
          if (window.showToast) {
            window.showToast(`⚡ ยิงสแกนบาร์โค้ด "${text}" สำเร็จ!`, 'zap');
          }
        }, 20);
      }
    }, 12);
  }

  // ==========================================================================
  // 4. Thai Kedmanee to English QWERTY Keyboard Translation Engine
  // ==========================================================================
  const THAI_KEDMANEE_TO_EN = {
    // Row 1: Numbers & Symbols (Unshifted / Shifted)
    'ๅ': '1', '/': '2', '-': '3', 'ภ': '4', 'ถ': '5', 'ุ': '6', 'ึ': '7', 'ค': '8', 'ต': '9', 'จ': '0', 'ข': '-', 'ช': '=',
    '+': '!', '๑': '@', '๒': '#', '๓': '$', '๔': '%', 'ู': '^', '฿': '&', '๕': '*', '๖': '(', '๗': ')', '๘': '_', '๙': '+',

    // Row 2: QWERTY Row
    'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']', 'ฃ': '\\',
    '๐': 'Q', '"': 'W', 'ฎ': 'E', 'ฑ': 'R', 'ธ': 'T', 'ํ': 'Y', '๊': 'U', 'ณ': 'I', 'ฯ': 'O', 'ญ': 'P', 'ฐ': '{', ',': '}', 'ฅ': '|',

    // Row 3: ASDF Row
    'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': "'",
    'ฤ': 'A', 'ฆ': 'S', 'ฏ': 'D', 'โ': 'F', 'ฌ': 'G', '็': 'H', '๋': 'J', 'ษ': 'K', 'ศ': 'L', 'ซ': ':', '.': '"',

    // Row 4: ZXCV Row
    'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
    '(': 'Z', ')': 'X', 'ฉ': 'C', 'ฮ': 'V', 'ฺ': 'B', '์': 'N', '?': 'M', 'ฒ': '<', 'ฬ': '>', 'ฦ': '?'
  };

  /**
   * Convert Thai Kedmanee text string to US English QWERTY
   * @param {string} str Input string (e.g. 'ญฯขฆฉฤ์ขตต' or 'ยนขหแฟืขตต')
   * @returns {string} Converted English string (e.g. 'PO-SCAN-99')
   */
  function convertThaiKedmaneeToEnglish(str) {
    if (!str || typeof str !== 'string') return '';
    let res = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      res += THAI_KEDMANEE_TO_EN[ch] !== undefined ? THAI_KEDMANEE_TO_EN[ch] : ch;
    }
    return res;
  }

  /**
   * Decode KeyboardEvent directly to English using physical e.code
   * Completely immune to Windows language settings (Thai / EN)
   * @param {KeyboardEvent} e
   * @returns {string} English character or empty string
   */
  function decodeKeyEventToEnglish(e) {
    const code = e.code;
    const isShift = e.shiftKey;

    if (code && code.startsWith('Key')) {
      const char = code.slice(3);
      return isShift ? char.toUpperCase() : char.toLowerCase();
    }

    if (code && code.startsWith('Digit')) {
      const num = code.slice(5);
      if (!isShift) return num;
      const shiftNums = {
        '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
        '6': '^', '7': '&', '8': '*', '9': '(', '0': ')'
      };
      return shiftNums[num] || num;
    }

    if (code === 'Minus') return isShift ? '_' : '-';
    if (code === 'Equal') return isShift ? '+' : '=';
    if (code === 'Slash') return isShift ? '?' : '/';
    if (code === 'Period') return isShift ? '>' : '.';
    if (code === 'Comma') return isShift ? '<' : ',';
    if (code === 'Semicolon') return isShift ? ':' : ';';
    if (code === 'Quote') return isShift ? '"' : "'";
    if (code === 'BracketLeft') return isShift ? '{' : '[';
    if (code === 'BracketRight') return isShift ? '}' : ']';
    if (code === 'Backslash') return isShift ? '|' : '\\';
    if (code === 'Backquote') return isShift ? '~' : '`';
    if (code === 'Space') return ' ';

    // Fallback: If e.key is a Thai character, convert it using the Kedmanee map
    if (e.key && e.key.length === 1) {
      return convertThaiKedmaneeToEnglish(e.key);
    }

    return '';
  }

  // Export to global scope
  window.generateBarcodeSVG = generateBarcodeSVG;
  window.generateQRCodeSVG = generateQRCodeSVG;
  window.simulateBarcodeScan = simulateBarcodeScan;
  window.convertThaiKedmaneeToEnglish = convertThaiKedmaneeToEnglish;
  window.decodeKeyEventToEnglish = decodeKeyEventToEnglish;

})();
