# AS7341 Microbit MakeCode Extension

Full-featured driver for the Adafruit AS7341 10-channel spectral sensor,
ported from the Adafruit Arduino library to Microbit MakeCode (TypeScript).

## Features

- I2C driver for AS7341 (address 0x39)
- Full register map
- Gain, integration time, and ASTEP configuration
- SMUX + bank switching (F1–F4 / F5–F8 / CLEAR / NIR)
- Blocking and interrupt-driven spectral measurements
- Low/high threshold configuration
- Flicker detection (100 / 120 Hz)
- LED control (indicator LED + current)
- MakeCode blocks for easy use

## Wiring

- AS7341 VIN → 3V
- AS7341 GND → GND
- AS7341 SCL → micro:bit SCL (pin 19 on edge connector)
- AS7341 SDA → micro:bit SDA (pin 20 on edge connector)

## Usage (MakeCode)

1. Import this repo as an extension in MakeCode.
2. Use blocks:

- `AS7341 initialize sensor`
- `AS7341 read spectrum` → returns an array of 10 values:
  - F1, F2, F3, F4, CLEAR, NIR, F5, F6, F7, F8
- `AS7341 detect flicker` → returns 0, 100, or 120
- `AS7341 set indicator LED on/off`
- `AS7341 set LED current mA`

## Example (TypeScript)

```ts
AS7341.init()
AS7341.setIndicatorLED(true)

basic.forever(function () {
    let spec = AS7341.readSpectrum()
    serial.writeLine("F1=" + spec[0] + " F2=" + spec[1] + " F3=" + spec[2] + " F4=" + spec[3])
    serial.writeLine("CLEAR=" + spec[4] + " NIR=" + spec[5])
    serial.writeLine("F5=" + spec[6] + " F6=" + spec[7] + " F7=" + spec[8] + " F8=" + spec[9])

    let flicker = AS7341.detectFlicker()
    serial.writeLine("Flicker Hz: " + flicker)

    basic.pause(1000)
})
