// AS7341 Microbit Driver
// Ported from Adafruit AS7341 Arduino library

namespace AS7341 {

    const I2C_ADDR = 0x39;

    // -----------------------------
    // Register Map
    // -----------------------------
    const REG_ENABLE = 0x80;
    const REG_ATIME = 0x81;
    const REG_WTIME = 0x83;

    const REG_SP_LOW_TH_L = 0x84;
    const REG_SP_LOW_TH_H = 0x85;
    const REG_SP_HIGH_TH_L = 0x86;
    const REG_SP_HIGH_TH_H = 0x87;

    const REG_ASTATUS = 0x94;
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

    const REG_SMUX_EN = 0xAF;
    const REG_SMUX_CONFIG = 0xB0;

    const REG_INTENAB = 0xF9;
    const REG_CONTROL = 0xFA;
    const REG_FIFO_MAP = 0xFC;

    const REG_FLICKER_CONTROL = 0xB3;
    const REG_FLICKER_STATUS = 0xB4;

    const REG_LED = 0x74;
    const REG_LED_CURRENT = 0x75;

    // -----------------------------
    // Enums
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
    };

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
    };

    // -----------------------------
    // I2C Helpers
    // -----------------------------
    function writeReg(reg: number, value: number) {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value & 0xFF;
        pins.i2cWriteBuffer(I2C_ADDR, buf);
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
    //% block="AS7341 initialize sensor (low-level)"
    export function begin(): boolean {
        powerEnable(true);
        basic.pause(5);

        // Enable spectral measurement
        let v = readReg(REG_ENABLE);
        v |= 0x02; // SP_EN
        writeReg(REG_ENABLE, v);
        basic.pause(5);

        // Some sane defaults
        setATIME(100);
        setASTEP(999);
        setGain(Gain.GAIN_4X);

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

    // Integration time in ms (approx)
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
    // Channel Reading (raw)
    // -----------------------------
    export function readChannel(ch: Channel): number {
        const base = REG_CH0_DATA_L + (ch * 2);
        return read16(base);
    }

    // -----------------------------
    // SMUX Helpers
    // -----------------------------
    function setSMUXCommand(cmd: number) {
        writeReg(REG_SMUX_EN, cmd);
    }

    function enableSMUX() {
        setSMUXCommand(0x10); // SMUX write
        basic.pause(5);
    }

    function setBank(bank: number) {
        let cfg0 = readReg(REG_CFG0);
        if (bank == 0) cfg0 &= ~0x04;
        else cfg0 |= 0x04;
        writeReg(REG_CFG0, cfg0);
    }

    function enableSpectralMeasurement() {
        let v = readReg(REG_ENABLE);
        v |= 0x02; // SP_EN
        writeReg(REG_ENABLE, v);
    }

    // -----------------------------
    // SMUX Config: F1–F4 + CLEAR + NIR
    // -----------------------------
    function setup_F1F4_Clear_NIR() {
        enableSMUX();

        let cfg = [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ];

        // Simplified mapping, mirroring Adafruit logic
        cfg[0x00] = 0x30; // F1
        cfg[0x01] = 0x01;
        cfg[0x02] = 0x30; // F2
        cfg[0x03] = 0x01;
        cfg[0x04] = 0x30; // F3
        cfg[0x05] = 0x01;
        cfg[0x06] = 0x30; // F4
        cfg[0x07] = 0x01;

        cfg[0x0A] = 0x00; // CLEAR
        cfg[0x0B] = 0x20;

        cfg[0x0E] = 0x00; // NIR
        cfg[0x0F] = 0x50;

        for (let i = 0; i < cfg.length; i++) {
            writeReg(REG_SMUX_CONFIG + i, cfg[i]);
        }

        setSMUXCommand(0x00); // SMUX execute
        basic.pause(5);
    }

    // -----------------------------
    // SMUX Config: F5–F8 + CLEAR + NIR
    // -----------------------------
    function setup_F5F8_Clear_NIR() {
        enableSMUX();

        let cfg = [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ];

        cfg[0x00] = 0x30; // F5
        cfg[0x01] = 0x01;
        cfg[0x02] = 0x30; // F6
        cfg[0x03] = 0x01;
        cfg[0x04] = 0x30; // F7
        cfg[0x05] = 0x01;
        cfg[0x06] = 0x30; // F8
        cfg[0x07] = 0x01;

        cfg[0x0A] = 0x00; // CLEAR
        cfg[0x0B] = 0x20;

        cfg[0x0E] = 0x00; // NIR
        cfg[0x0F] = 0x50;

        for (let i = 0; i < cfg.length; i++) {
            writeReg(REG_SMUX_CONFIG + i, cfg[i]);
        }

        setSMUXCommand(0x00);
        basic.pause(5);
    }

    // -----------------------------
    // Blocking read of all channels (SMUX-based)
    // -----------------------------
    //% block="AS7341 read all AS7341 channels (low-level)"
    export function readAllChannels(): number[] {
        let out: number[] = [];

        // Bank 0: F1–F4 + CLEAR + NIR
        setBank(0);
        setup_F1F4_Clear_NIR();
        enableSpectralMeasurement();
        basic.pause(getTINT());

        out.push(readChannel(Channel.F1));
        out.push(readChannel(Channel.F2));
        out.push(readChannel(Channel.F3));
        out.push(readChannel(Channel.F4));
        out.push(readChannel(Channel.CLEAR));
        out.push(readChannel(Channel.NIR));

        // Bank 1: F5–F8 + CLEAR + NIR
        setBank(1);
        setup_F5F8_Clear_NIR();
        enableSpectralMeasurement();
        basic.pause(getTINT());

        out.push(readChannel(Channel.F5));
        out.push(readChannel(Channel.F6));
        out.push(readChannel(Channel.F7));
        out.push(readChannel(Channel.F8));

        return out;
    }

    // -----------------------------
    // Interrupts + Thresholds + Status
    // -----------------------------
    export function enableSpectralInterrupt(enable: boolean) {
        let v = readReg(REG_INTENAB);
        if (enable) v |= 0x01;  // SP_INT_EN
        else v &= ~0x01;
        writeReg(REG_INTENAB, v);
    }

    export function setLowThreshold(value: number) {
        writeReg(REG_SP_LOW_TH_L, value & 0xFF);
        writeReg(REG_SP_LOW_TH_H, (value >> 8) & 0xFF);
    }

    export function setHighThreshold(value: number) {
        writeReg(REG_SP_HIGH_TH_L, value & 0xFF);
        writeReg(REG_SP_HIGH_TH_H, (value >> 8) & 0xFF);
    }

    export function getLowThreshold(): number {
        let lo = readReg(REG_SP_LOW_TH_L);
        let hi = readReg(REG_SP_LOW_TH_H);
        return (hi << 8) | lo;
    }

    export function getHighThreshold(): number {
        let lo = readReg(REG_SP_HIGH_TH_L);
        let hi = readReg(REG_SP_HIGH_TH_H);
        return (hi << 8) | lo;
    }

    export function spectralInterruptTriggered(): boolean {
        let status = readReg(REG_STATUS2);
        return (status & 0x40) != 0;  // SP_INT
    }

    export function spectralHighTriggered(): boolean {
        let status = readReg(REG_STATUS3);
        return (status & 0x20) != 0;  // SP_HI
    }

    export function spectralLowTriggered(): boolean {
        let status = readReg(REG_STATUS3);
        return (status & 0x10) != 0;  // SP_LO
    }

    export function clearSpectralInterrupt() {
        writeReg(REG_STATUS2, 0x40);
    }

    export function measurementReady(): boolean {
        let astat = readReg(REG_ASTATUS);
        return (astat & 0x40) != 0;  // AVALID
    }

    export function waitForMeasurement(timeout = 1000): boolean {
        let t0 = control.millis();
        while (control.millis() - t0 < timeout) {
            if (measurementReady()) return true;
            basic.pause(2);
        }
        return false;
    }

    export function readAllChannelsInterruptDriven(): number[] {
        enableSpectralInterrupt(true);
        enableSpectralMeasurement();

        if (!waitForMeasurement(getTINT() + 20)) {
            return [];
        }

        clearSpectralInterrupt();
        return readAllChannels();
    }

    // -----------------------------
    // LED Control
    // -----------------------------
    //% block="AS7341 set indicator LED %on"
    export function setIndicatorLED(on: boolean) {
        let v = readReg(REG_LED);
        if (on) v |= 0x01;
        else v &= ~0x01;
        writeReg(REG_LED, v);
    }

    //% block="AS7341 set LED current %milliamps"
    export function setLEDCurrent(milliamps: number) {
        if (milliamps < 0) milliamps = 0;
        if (milliamps > 20) milliamps = 20;
        writeReg(REG_LED_CURRENT, milliamps);
    }

    // -----------------------------
    // Flicker Detection
    // -----------------------------
    //% block="AS7341 start flicker detection"
    export function startFlickerDetection() {
        writeReg(REG_FLICKER_CONTROL, 0x8A);
    }

    //% block="AS7341 read flicker Hz"
    export function readFlickerHz(): number {
        let v = readReg(REG_FLICKER_STATUS);
        if (v == 0x01) return 100;
        if (v == 0x02) return 120;
        return 0;
    }

    // -----------------------------
    // Advanced Measurement Helpers
    // -----------------------------
    export function startMeasurement() {
        enableSpectralMeasurement();
    }

    export function measurementComplete(): boolean {
        return measurementReady();
    }

    function readBank(bank: number): number[] {
        setBank(bank);

        if (bank == 0) setup_F1F4_Clear_NIR();
        else setup_F5F8_Clear_NIR();

        startMeasurement();
        basic.pause(getTINT());

        let out: number[] = [];

        if (bank == 0) {
            out.push(readChannel(Channel.F1));
            out.push(readChannel(Channel.F2));
            out.push(readChannel(Channel.F3));
            out.push(readChannel(Channel.F4));
            out.push(readChannel(Channel.CLEAR));
            out.push(readChannel(Channel.NIR));
        } else {
            out.push(readChannel(Channel.F5));
            out.push(readChannel(Channel.F6));
            out.push(readChannel(Channel.F7));
            out.push(readChannel(Channel.F8));
        }

        return out;
    }

    // -----------------------------
    // High-level Convenience API
    // -----------------------------
    //% block="AS7341 initialize sensor"
    export function init() {
        begin();
    }

    //% block="AS7341 read channel %ch"
    export function readSingle(ch: Channel): number {
        return readChannel(ch);
    }

    //% block="AS7341 read spectrum"
    export function readSpectrum(): number[] {
        return getAllChannels();
    }

    //% block="AS7341 detect flicker"
    export function detectFlicker(): number {
        startFlickerDetection();
        basic.pause(50);
        return readFlickerHz();
    }

    //% block="AS7341 read all channels (10-band)"
    export function getAllChannels(): number[] {
        let a = readBank(0);
        let b = readBank(1);
        return a.concat(b);
    }
}
