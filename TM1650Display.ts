
   //% color=#5C2D91 weight=101 icon="\uf26c"
   class TM1650Display {
        public displayDigits: number[] = [0, 0, 0, 0]

        //% help=TM1650Display weight=76
        //% blockId=TM1650Display.contructor block="TM1650Display|x %x|y %y"
        //% parts="tm1650"
        constructor(clock: DigitalPin = DigitalPin.P1, data: DigitalPin = DigitalPin.P0) {
            this.clockpin = clock
            this.datapin = data
            pins.setPull(clock, PinPullMode.PullUp)
            pins.setPull(data, PinPullMode.PullUp)
            this.goidle()
        }
        public displayOn(brightness: number = 0) {
            brightness &= 7
            brightness <<= 4
            brightness |= 1
            this.sendpair(0x48, brightness)
        }
        public displayOff() {
            this.sendpair(0x48, 0)
        }
        public displayClear() {
            this.sendpair(this.digaddress[0], 0)
            this.sendpair(this.digaddress[1], 0)
            this.sendpair(this.digaddress[2], 0)
            this.sendpair(this.digaddress[3], 0)
            this.displayDigits[0] = 0
            this.displayDigits[1] = 0
            this.displayDigits[2] = 0
            this.displayDigits[3] = 0
        }
        public showChar(pos: number = 0, c: number = 0) {
            let charindex = 30
            pos &= 3
            charindex = this.chartoindex(c)
            if (c == 0x2E) {
                this.displayDigits[pos] |= 128
            } else {
                this.displayDigits[pos] = this.chargen[charindex]
            }
            this.sendpair(this.digaddress[pos], this.displayDigits[pos])
        }
        public showCharWithPoint(pos: number = 0, c: number = 0) {
            let charindex2 = 30
            pos &= 3
            charindex2 = this.chartoindex(c)
            this.displayDigits[pos] = this.chargen[charindex2] | 128
            this.sendpair(this.digaddress[pos], this.displayDigits[pos])
        }
        public showString(s: string) {
            let outc: number[] = []
            let dp: number[] = [0, 0, 0, 0]
            let c = 0
            let index = 0
            let di = 0

            for (index = 0, di = 0; (index < s.length) && (di < 4); index++) {
                c = s.charCodeAt(index)
                if (c == 0x2E) {
                    if (di == 0) {
                        outc[di] = 32
                        dp[di] = 1
                        di++
                    } else {
                        if (dp[di - 1] == 0) {
                            dp[di - 1] = 1
                        } else {
                            dp[di] = 1
                            di++
                            outc[di] = 32
                        }
                    }
                } else {
                    outc[di] = c
                    di++
                }
            }
            for (index = 0; index < di; index++) {
                c = outc[index]
                if (dp[index] == 0) {
                    this.showChar(index, c)
                }
                else {
                    this.showCharWithPoint(index, c)
                }
            }
        }
        public showInteger(n: number = 0) {
            let outc2: number[] = [32, 32, 32, 32]
            let i = 3
            let absn = 0

            if ((n > 9999) || (n < -999)) {
                this.showString("Err ")
            } else {
                absn = Math.abs(n)
                if (absn == 0) {
                    outc2[3] = 0x30
                } else {
                    while (absn != 0) {
                        outc2[i] = (absn % 10) + 0x30
                        absn = Math.floor(absn / 10)
                        i = i - 1
                    }
                    if (n < 0) {
                        outc2[i] = 0x2D
                    }
                }
                for (i = 0; i < 4; i++) {
                    this.showChar(i, outc2[i])
                }
            }
        }
        public showHex(n: number = 0) {
            let outc3: number[] = [32, 32, 32, 32]
            let j = 3
            let d = 0
            let absn2 = 0

            if ((n > 0xFFFF) || (n < -32768)) {
                this.showString("Err ")
            } else {
                if (n < 0) {
                    n = 0x10000 + n
                }
                if (n == 0) {
                    outc3[3] = 0x30
                } else {
                    while (n != 0) {
                        d = (n % 16)
                        if (d < 10) {
                            d += 0x30
                        } else {
                            d += 55
                        }
                        outc3[j] = d
                        n = Math.floor(n / 16)
                        j = j - 1
                    }
                }
                for (j = 0; j < 4; j++) {
                    this.showChar(j, outc3[j])
                }
            }
        }
        public showDecimal(n: number = 0) {
            let s: string = ""
            let targetlen = 4

            if ((n > 9999) || (Math.abs(n) < 0.001) || (n < -999)) {
                this.showString("Err ")
            } else {
                s = n.toString()
                if (s.includes(".")) {
                    targetlen = 5
                }
                while (s.length < targetlen) {
                    s = " " + s
                }
                this.showString(s)
            }
        }
        public toggleDP(pos: number = 0) {
            this.displayDigits[pos] ^= 128
            this.sendpair(this.digaddress[pos], this.displayDigits[pos])
        }

        private clockpin: DigitalPin
        private datapin: DigitalPin
        private chargen: number[] = [
            0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F,  /* 0 - 9 */
            0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71, 0x3D, 0x76, 0x06, 0x0E,  /* A - J */
            0x38, 0x54, 0x74, 0x73, 0x67, 0x50, 0x78, 0x1C, 0x40, 0x63,  /* LnoPQrtu-* (degree) */
            0x00]
        private digaddress: number[] = [0x68, 0x6A, 0x6C, 0x6E]
        private chartoindex(c: number) {
            let charcode = 30
            if (c < 30) {
                charcode = c
            } else {
                if ((c > 0x2F) && (c < 0x3A)) {
                    charcode = c - 0x30
                } else {
                    if (c > 0x40) {
                        c &= 0xDF    /* uppercase */
                    }
                    if ((c > 0x40) && (c < 0x4B)) {
                        charcode = c - 0x37
                    } else {
                        if (c == 0x4C) {
                            charcode = 20
                        }
                        if ((c >= 0x4E) && (c <= 0x52)) {
                            charcode = 21 + (c - 0x4E)
                        }
                        if (c == 0x54) {
                            charcode = 26
                        }
                        if (c == 0x55) {
                            charcode = 27
                        }
                        if (c == 0x2D) {
                            charcode = 28
                        }
                        if (c == 0x2A) {
                            charcode = 29
                        }
                    }
                }
            }
            return (charcode)
        }
        private sendpair(byte1: number, byte2: number) {
            this.sendstart()
            this.sendbyte(byte1)
            this.sendbyte(byte2)
            this.goidle()
        }
        private sendstart() {
            /* Clock and data both start at 1 */
            pins.digitalWritePin(this.datapin, 0)
            control.waitMicros(250)
            pins.digitalWritePin(this.clockpin, 0)
            control.waitMicros(50)
        }
        private goidle() {
            pins.digitalWritePin(this.clockpin, 1)
            control.waitMicros(250)
            pins.digitalWritePin(this.datapin, 1)
            control.waitMicros(250)
        }
        private sendbyte(byte: number) {
            /* Resting is both clock and data HIGH. */
            /* In here, clock will start and end LOW, SDA unknown */
            /* data are clocked out MSB first, 8 bits and then an incoming ACK bit */
            let bitmask = 128
            let ackbit = 0

            while (bitmask != 0) {
                control.waitMicros(150)
                if ((byte & bitmask) == 0) {
                    pins.digitalWritePin(this.datapin, 0)
                } else {
                    pins.digitalWritePin(this.datapin, 1)
                }
                control.waitMicros(100)
                pins.digitalWritePin(this.clockpin, 1)
                control.waitMicros(250)
                pins.digitalWritePin(this.clockpin, 0)
                bitmask >>= 1
            }
            /* Clock is now low and we want the ACK bit so this time read SDA */
            /* SDA is unknown, give a brief delay then drop data to zero */
            control.waitMicros(25)
            pins.digitalWritePin(this.datapin, 0)
            control.waitMicros(250)
            /* Do one clock */
            pins.digitalWritePin(this.clockpin, 1)
            control.waitMicros(250)
            pins.digitalWritePin(this.clockpin, 0)
            /* Display takes 120+ microseconds to send ack */
            control.waitMicros(150)
            ackbit = pins.digitalReadPin(this.datapin)
            pins.digitalWritePin(this.datapin, 0)
            control.waitMicros(100)
        }
    }

