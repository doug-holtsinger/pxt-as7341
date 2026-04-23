// AS7341 Microbit Driver (Starter Template)
// Based on Adafruit AS7341 Arduino library (BSD License)

namespace AS7341 {

    const I2C_ADDR = 0x39;

    // -------- Register Map (from Adafruit_AS7341.h) --------
    const REG_ENABLE = 0x80;
    const REG_ATIME = 0x81;
    const REG_ASTEP_L = 0xCA;
    const REG_ASTEP_H = 0xCB;
    const REG_CFG0 = 0xA9;
    const REG_CFG1 = 0xAA;
    const REG_CFG6 = 0xAF;
    const REG_STATUS2 = 0xA3;

    // Spectral data registers (F1–F8)
    const REG_CH0_DATA_L = 0x95; // F1
    // ... add remaining registers here

    // -------- I2C Helpers --------
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

    // -------- Initialization --------
    //% block="initialize AS7341"
    export function begin(): boolean {
        // Enable power + spectral measurement
        writeReg(REG_ENABLE, 0x01); // PON
        basic.pause(5);
        writeReg(REG_ENABLE, 0x03); // PON + SP_EN
        basic.pause(5);

        // Basic defaults
        setATIME(100);
        setASTEP(999);

        return true;
    }

    // -------- Timing Configuration --------
    //% block="set ATIME %value"
    export function setATIME(value: number) {
        writeReg(REG_ATIME, value & 0xFF);
    }

    //% block="set ASTEP %value"
    export function setASTEP(value: number) {
        writeReg(REG_ASTEP_L, value & 0xFF);
        writeReg(REG_ASTEP_H, (value >> 8) & 0xFF);
    }

    // -------- Read a single channel (example: F1) --------
    //% block="read F1 channel"
    export function readF1(): number {
        return read16(REG_CH0_DATA_L);
    }

    // Add functions for F2–F8, NIR, CLEAR, etc.
}
