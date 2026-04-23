namespace AS7341 {

    const I2C_ADDR = 0x39;

    // -----------------------------
    // Register Map (full)
    // -----------------------------
    const REG_ENABLE = 0x80;
    const REG_ATIME = 0x81;
    const REG_WTIME = 0x83;

    const REG_SP_LOW_TH_L = 0x84;
    const REG_SP_LOW_TH_H = 0x85;
    const REG_SP_HIGH_TH_L = 0x86;
    const REG_SP_HIGH_TH_H = 0x87;

    const REG_STATUS = 0x93;
    const REG_CH0_DATA_L = 0x95;
    const REG_CH0_DATA_H = 0x96;
    const REG_CH1_DATA_L = 0x97;
    const REG_CH1_DATA_H = 0x98;
    const REG_CH2_DATA_L = 0x99;
    const REG_CH2_DATA_H = 0x9A;
    const REG_CH3_DATA_L = 0x9B;
    const REG_CH3_DATA_H = 0x9C;
    const REG_CH4_DATA_L = 0x9D;
    const REG_CH4_DATA_H = 0x9E;
    const REG_CH5_DATA_L = 0x9F;
    const REG_CH5_DATA_H = 0xA0;

    const REG_STATUS2 = 0xA3;
    const REG_STATUS3 = 0xA4;

    const REG_CFG0 = 0xA9;
    const REG_CFG1 = 0xAA;
    const REG_CFG6 = 0xAF;

    const REG_ASTEP_L = 0xCA;
    const REG_ASTEP_H = 0xCB;

    const REG_SMUX_CMD = 0xAF;

    // -----------------------------
    // Enums (Arduino equivalents)
    // -----------------------------
    export enum Gain {
        GAIN_0_5X = 0,
        GAIN_1X = 1,
        GAIN_2X = 2,
        GAIN_4X = 3,
        GAIN_8X = 4,
        GAIN_16X = 5,
        GAIN_32X = 6,
        GAIN_64X = 7,
        GAIN_128X = 8,
        GAIN_256X = 9
    }

    export enum Channel {
        F1 = 0,
        F2 = 1,
        F3 = 2,
        F4 = 3,
        F5 = 4,
        F6 = 5,
        F7 = 6,
        F8 = 7,
        CLEAR = 8,
        NIR = 9
    }

    // -----------------------------
    // I2C Helpers
    // -----------------------------
    function writeReg(reg: number, value: number) {
        pins.i2cWriteBuffer(I2C_ADDR, pins.createBufferFromArray([reg, value]));
    }

    function readReg(reg: number): number {
        pins.i2cWriteNumber(I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt8BE);
    }

    function read16(reg: number): number {
        pins.i2cWriteNumber(I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt16LE);
    }

    // -----------------------------
    // Power + Initialization
    // -----------------------------
    //% block="initialize AS7341"
    export function begin(): boolean {
        powerEnable(true);
        basic.pause(5);

        // Enable spectral measurement
        writeReg(REG_ENABLE, 0x03);
        basic.pause(5);

        return true;
    }

    export function powerEnable(on: boolean) {
        let v = readReg(REG_ENABLE);
        if (on) v |= 0x01;
        else v &= ~0x01;
        writeReg(REG_ENABLE, v);
    }

    // -----------------------------
    // Timing
    // -----------------------------
    export function setATIME(v: number) {
        writeReg(REG_ATIME, v & 0xFF);
    }

    export function getATIME(): number {
        return readReg(REG_ATIME);
    }

    export function setASTEP(v: number) {
        writeReg(REG_ASTEP_L, v & 0xFF);
        writeReg(REG_ASTEP_H, (v >> 8) & 0xFF);
    }

    export function getASTEP(): number {
        let lo = readReg(REG_ASTEP_L);
        let hi = readReg(REG_ASTEP_H);
        return (hi << 8) | lo;
    }

    export function getTINT(): number {
        let atime = getATIME();
        let astep = getASTEP();
        return (atime + 1) * (astep + 1) * 2.78;
    }

    // -----------------------------
    // Gain
    // -----------------------------
    export function setGain(g: Gain) {
        writeReg(REG_CFG1, g);
    }

    export function getGain(): Gain {
        return readReg(REG_CFG1);
    }

    // -----------------------------
    // Channel Reading
    // -----------------------------
    export function readChannel(ch: Channel): number {
        const base = REG_CH0_DATA_L + (ch * 2);
        return read16(base);
    }

    // Blocking read of all channels
    export function readAllChannels(): number[] {
        let out: number[] = [];
        for (let i = 0; i < 10; i++) {
            out.push(readChannel(i));
        }
        return out;
    }
}
