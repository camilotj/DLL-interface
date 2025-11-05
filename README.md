# TMG IO-Link Node.js Interface

A simple Node.js interface for TMG USB IO-Link Master devices.

## Quick Start

```bash
npm install
npm start
```

## Requirements

- TMG USB IO-Link Master V2 driver
- Windows (DLL dependency)
- Node.js with native module support

Run `npm start` to see a complete demo of all functionality.

## Typescript version

src/
  ├── ffi-bindings.d.ts     # TypeScript type definitions for FFI
  ├── ffi-bindings.js       # JavaScript FFI implementation
  ├── index.ts             # Main entry point
  ├── iolink-interface.ts  # Core interface implementation
  ├── test.ts             # Test implementation
  └── types.ts            # Consolidated type definitions
