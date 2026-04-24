// AS7341 Microbit Driver
// Ported from Adafruit AS7341 Arduino library

namespace AS7341 {

    const I2C_ADDR = 0x39;

    // -----------------------------
    // Register Map
    // -----------------------------
    const AS7341_ENABLE = 0x80;
    const AS7341_ATIME = 0x81;
    const AS7341_WTIME = 0x83;

    const AS7341_SP_LOW_TH_L = 0x84;
    const AS7341_SP_LOW_TH_H = 0x85;
    const AS7341_SP_HIGH_TH_L = 0x86;
    const AS7341_SP_HIGH_TH_H = 0x87;

    const AS7341_ASTATUS = 0x94;
    const AS7341_STATUS = 0x93;

    const AS7341_CH0_DATA_L = 0x95;
    const AS7341_CH0_DATA_H = 0x96;
    const AS7341_CH1_DATA_L = 0x97;
    const AS7341_CH1_DATA_H = 0x98;
    const AS7341_CH2_DATA_L = 0x99;
    const AS7341_CH2_DATA_H = 0x9A;
    const AS7341_CH3_DATA_L = 0x9B;
    const AS7341_CH3_DATA_H = 0x9C;
    const AS7341_CH4_DATA_L = 0x9D;
    const AS7341_CH4_DATA_H = 0x9E;
    const AS7341_CH5_DATA_L = 0x9F;
    const AS7341_CH5_DATA_H = 0xA0;

    const AS7341_STATUS2 = 0xA3;
    const AS7341_STATUS3 = 0xA4;

    const AS7341_CFG0 = 0xA9;
    const AS7341_CFG1 = 0xAA;
    const AS7341_CFG6 = 0xAF;

    const AS7341_ASTEP_L = 0xCA;
    const AS7341_ASTEP_H = 0xCB;

    const AS7341_SMUX_EN = 0xAF;
    const AS7341_SMUX_CONFIG = 0xB0;

    const AS7341_INTENAB = 0xF9;
    const AS7341_CONTROL = 0xFA;
    const AS7341_FIFO_MAP = 0xFC;

    const AS7341_FLICKER_CONTROL = 0xB3;
    const AS7341_FLICKER_STATUS = 0xB4;

    const AS7341_LED = 0x74;
    const AS7341_LED_CURRENT = 0x75;

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

    /** Channel Colours */
    /** SMUX Config for F1,F2,F3,F4,NIR,Clear */
    /** SMUX Config for F5,F6,F7,F8,NIR,Clear */
    enum AS7341_CH_COLORS {
        violet = 0,  // buffer F1
        indigo = 2,  // buffer F2
        blue   = 4,  // buffer F3
        cyan   = 6,  // buffer F4
        green  = 12, // buffer F5
        yellow = 14, // buffer F6
        red    = 16, // buffer F7
        farred = 18, // buffer F8
        nir    = 20, // buffer NIR
        clear  = 22  // buffer clear
        //flicker
    };

    /** Available SMUX configuration commands */
    enum AS7341_SMUX_CMD {
        AS7341_SMUX_CMD_ROM_RESET,  // ROM code initialization of SMUX
        AS7341_SMUX_CMD_READ,       // Read SMUX configuration to RAM from SMUX chain
        AS7341_SMUX_CMD_WRITE,      // Write SMUX configuration from RAM to SMUX chain
    };

    // -----------------------------
    // Properties
    // -----------------------------
    adc: Buffer;

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
        let v = readReg(AS7341_ENABLE);
        v |= 0x02; // SP_EN
        writeReg(AS7341_ENABLE, v);
        basic.pause(5);

        // Some sane defaults
        setATIME(100);
        setASTEP(999);
        setGain(Gain.GAIN_4X);

        return true;
    }

    export function powerEnable(on: boolean) {
        let v = readReg(AS7341_ENABLE);
        if (on) v |= 0x01;
        else v &= ~0x01;
        writeReg(AS7341_ENABLE, v);
    }

    // -----------------------------
    // Timing
    // -----------------------------
    export function setATIME(v: number) {
        writeReg(AS7341_ATIME, v & 0xFF);
    }

    export function getATIME(): number {
        return readReg(AS7341_ATIME);
    }

    export function setASTEP(v: number) {
        writeReg(AS7341_ASTEP_L, v & 0xFF);
        writeReg(AS7341_ASTEP_H, (v >> 8) & 0xFF);
    }

    export function getASTEP(): number {
        let lo = readReg(AS7341_ASTEP_L);
        let hi = readReg(AS7341_ASTEP_H);
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
        writeReg(AS7341_CFG1, g);
    }

    export function getGain(): Gain {
        return readReg(AS7341_CFG1);
    }

    // -----------------------------
    // Channel Reading (raw)
    // -----------------------------
    export function readChannel(ch: Channel): number {
        const base = AS7341_CH0_DATA_L + (ch * 2);
        return read16(base);
    }

    // -----------------------------
    // SMUX Helpers
    // -----------------------------
    function setSMUXCommand(cmd: AS7341_SMUX_CMD) {
        let cfg6_reg = readReg(AS7341_SMUX_EN);
	// reset fourth and fifth bits
        cfg6_reg &= ~0x18;
        // write new command
        cfg6_reg |= cmd << 3;
        writeReg(AS7341_SMUX_EN, cmd);
    }

    function enableSMUX() {
        setSMUXCommand(AS7341_SMUX_CMD_WRITE); // SMUX write
        basic.pause(20);
    }

    function setBank(bank: number) {
        let cfg0 = readReg(AS7341_CFG0);
        if (bank == 0) cfg0 &= ~0x04;
        else cfg0 |= 0x04;
        writeReg(AS7341_CFG0, cfg0);
    }

    function enableSpectralMeasurement(spectra_enable: boolean) {
        let v = readReg(AS7341_ENABLE);
        if (spectra_enable) {
            v |= 1 << 1; 
        } else {
            v &= ~(1 << 1); 
        }
        writeReg(AS7341_ENABLE, v);
    }

    function setSMUXLowChannels(f1_f4: boolean) {
        enableSpectralMeasurement(false);
        setSMUXCommand(AS7341_SMUX_CMD_WRITE);
        if (f1_f4) {
          setup_F1F4_Clear_NIR();
        } else {
          setup_F5F8_Clear_NIR();
        }
        enableSMUX();
    }


    // -----------------------------
    // SMUX Config: F1–F4 + CLEAR + NIR
    // -----------------------------
    function setup_F1F4_Clear_NIR() {
        // SMUX Config for F1,F2,F3,F4,NIR,Clear

        let cfg = [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ];

        cfg[0x00] = 0x30; // F3 left set to ADC2
        cfg[0x01] = 0x01; // F1 left set to ADC0
        cfg[0x02] = 0x00; // Reserved or disabled
        cfg[0x03] = 0x00; // F8 left disabled
        cfg[0x04] = 0x00; // F6 left disabled
        cfg[0x05] = 0x42; // F4 left connected to ADC3/f2 left connected to ADC1
        cfg[0x06] = 0x00; // F5 left disbled
        cfg[0x07] = 0x00; // F7 left disbled
        cfg[0x08] = 0x50; // CLEAR connected to ADC4
        cfg[0x09] = 0x00; // F5 right disabled
        cfg[0x0A] = 0x00; // F7 right disabled
        cfg[0x0B] = 0x00; // Reserved or disabled
        cfg[0x0C] = 0x20; // F2 right connected to ADC1
        cfg[0x0D] = 0x04; // F4 right connected to ADC3
        cfg[0x0E] = 0x00; // F6/F8 right disabled
        cfg[0x0F] = 0x30; // F3 right connected to AD2
        cfg[0x10] = 0x01; // F1 right connected to AD0
        cfg[0x11] = 0x50; // CLEAR right connected to AD4
        cfg[0x12] = 0x00; // Reserved or disabled
        cfg[0x13] = 0x06; // NIR connected to ADC5

        for (let i = 0; i < cfg.length; i++) {
            writeReg(AS7341_SMUX_CONFIG + i, cfg[i]);
        }
    }

    // -----------------------------
    // SMUX Config: F5–F8 + CLEAR + NIR
    // -----------------------------
    function setup_F5F8_Clear_NIR() {

        let cfg = [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ];

	// SMUX Config for F5,F6,F7,F8,NIR,Clear
        cfg[0x00] = 0x00; // F3 left disable
        cfg[0x01] = 0x00; // F1 left disable
        cfg[0x02] = 0x00; // reserved/disable
        cfg[0x03] = 0x40; // F8 left connected to ADC3
        cfg[0x04] = 0x02; // F6 left connected to ADC1
        cfg[0x05] = 0x00; // F4/ F2 disabled
        cfg[0x06] = 0x10; // F5 left connected to ADC0
        cfg[0x07] = 0x03; // F7 left connected to ADC2
        cfg[0x08] = 0x50; // CLEAR Connected to ADC4
        cfg[0x09] = 0x10; // F5 right connected to ADC0
        cfg[0x0A] = 0x03; // F7 right connected to ADC2
        cfg[0x0B] = 0x00; // Reserved or disabled
        cfg[0x0C] = 0x00; // F2 right disabled
        cfg[0x0D] = 0x00; // F4 right disabled
        cfg[0x0E] = 0x24; // F8 right connected to ADC2/ F6 right connected to ADC1
        cfg[0x0F] = 0x00; // F3 right disabled
        cfg[0x10] = 0x00; // F1 right disabled
        cfg[0x11] = 0x50; // CLEAR right connected to AD4
        cfg[0x12] = 0x00; // Reserved or disabled
        cfg[0x13] = 0x06; // NIR connected to ADC5

        for (let i = 0; i < cfg.length; i++) {
            writeReg(AS7341_SMUX_CONFIG + i, cfg[i]);
        }
    }

    export function getIsDataReady(): boolean {
        let status = readReg(AS7341_STATUS2);
        return (status & 0x40) != 0;
    }

    export function delayForData() {
        while (!getIsDataReady()) {
            basic.pause(1);
        }
    }

    // -----------------------------
    // Blocking read of all channels (SMUX-based)
    // -----------------------------
    //
    //% block="AS7341 read all AS7341 channels"
    export function readAllChannels() {

        // Bank 0: F1–F4 + CLEAR + NIR
	setSMUXLowChannels(true);        // Configure SMUX to read low channels
        enableSpectralMeasurement(true); // Start integration
        delayForData();                 // I'll wait for you for all time

	// Read ADC
        pins.i2cWriteNumber(I2C_ADDR, AS7341_CH0_DATA_L, NumberFormat.UInt8BE, true);
        let bfr_L = pins.i2cReadBuffer(this.i2c, 12, false); // read 12 bytes

        // Bank 1: F5–F8 + CLEAR + NIR
	setSMUXLowChannels(false);        // Configure SMUX to read high channels
        enableSpectralMeasurement(true); // Start integration
        delayForData();                 // I'll wait for you for all time

        pins.i2cWriteNumber(I2C_ADDR, AS7341_CH0_DATA_L, NumberFormat.UInt8BE, true);
        let bfr_H = pins.i2cReadBuffer(this.i2c, 12, false); // read 12 bytes

	this.adc = bfr_L.concat(bfr_H);
    }

    /** Read a channel */
    //% block="Read | %col"
    //% weight=90 blockGap=8
    export function getADC(col: AS7341_CH_COLORS): number {
        return this.adc.getNumber(NumberFormat.UInt16LE, col)
    }

    // -----------------------------
    // Interrupts + Thresholds + Status
    // -----------------------------
    export function enableSpectralInterrupt(enable: boolean) {
        let v = readReg(AS7341_INTENAB);
        if (enable) v |= 0x01;  // SP_INT_EN
        else v &= ~0x01;
        writeReg(AS7341_INTENAB, v);
    }

    export function setLowThreshold(value: number) {
        writeReg(AS7341_SP_LOW_TH_L, value & 0xFF);
        writeReg(AS7341_SP_LOW_TH_H, (value >> 8) & 0xFF);
    }

    export function setHighThreshold(value: number) {
        writeReg(AS7341_SP_HIGH_TH_L, value & 0xFF);
        writeReg(AS7341_SP_HIGH_TH_H, (value >> 8) & 0xFF);
    }

    export function getLowThreshold(): number {
        let lo = readReg(AS7341_SP_LOW_TH_L);
        let hi = readReg(AS7341_SP_LOW_TH_H);
        return (hi << 8) | lo;
    }

    export function getHighThreshold(): number {
        let lo = readReg(AS7341_SP_HIGH_TH_L);
        let hi = readReg(AS7341_SP_HIGH_TH_H);
        return (hi << 8) | lo;
    }

    export function spectralInterruptTriggered(): boolean {
        let status = readReg(AS7341_STATUS2);
        return (status & 0x40) != 0;  // SP_INT
    }

    export function spectralHighTriggered(): boolean {
        let status = readReg(AS7341_STATUS3);
        return (status & 0x20) != 0;  // SP_HI
    }

    export function spectralLowTriggered(): boolean {
        let status = readReg(AS7341_STATUS3);
        return (status & 0x10) != 0;  // SP_LO
    }

    export function clearSpectralInterrupt() {
        writeReg(AS7341_STATUS2, 0x40);
    }

    export function measurementReady(): boolean {
        let astat = readReg(AS7341_ASTATUS);
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
        enableSpectralMeasurement(true);

        if (!waitForMeasurement(getTINT() + 20)) {
            return [];
        }

        clearSpectralInterrupt();
        return fetchAllChannels();
    }

    // -----------------------------
    // LED Control
    // -----------------------------
    //% block="AS7341 set indicator LED %on"
    export function setIndicatorLED(on: boolean) {
        let v = readReg(AS7341_LED);
        if (on) v |= 0x01;
        else v &= ~0x01;
        writeReg(AS7341_LED, v);
    }

    //% block="AS7341 set LED current %milliamps"
    export function setLEDCurrent(milliamps: number) {
        if (milliamps < 0) milliamps = 0;
        if (milliamps > 20) milliamps = 20;
        writeReg(AS7341_LED_CURRENT, milliamps);
    }

    // -----------------------------
    // Flicker Detection  FIXME
    // -----------------------------
    //% block="AS7341 start flicker detection"
    export function startFlickerDetection() {
        writeReg(AS7341_FLICKER_CONTROL, 0x8A);
    }

    //% block="AS7341 read flicker Hz"
    export function readFlickerHz(): number {
        let v = readReg(AS7341_FLICKER_STATUS);
        if (v == 0x01) return 100;
        if (v == 0x02) return 120;
        return 0;
    }

    // -----------------------------
    // Advanced Measurement Helpers
    // -----------------------------
    export function startMeasurement() {
        enableSpectralMeasurement(true);
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
