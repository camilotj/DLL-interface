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

## TypeScript conversion

Moving all FFI code to a pure JavaScript file (ffi-bindings.js)
Adding type definitions in a separate .d.ts file
Using a simpler re-export approach in types.ts
This gives us the best of both worlds:
The JavaScript FFI code runs exactly like before (Javascript implementation)
We get proper TypeScript type checking when using the types
No more type errors from the FFI bindings
Clean separation between runtime code and type definitions
The solution uses the fact that TypeScript's .d.ts files can declare types for JavaScript modules without TypeScript trying to type-check the JavaScript implementation itself. This is exactly what we needed for the FFI bindings which use dynamic features that TypeScript's type system can't properly model.

### Troubleshooting

I'll analyze the error and provide a detailed report of potential issues and solutions comparing the TypeScript and JavaScript implementations.

# IO-Link Interface Error Analysis Report

## Current Error
```typescript
TypeError: deviceStruct is not a constructor
at IOLinkInterface.getConnectedDevices
```

## Key Differences Between Working JS and Failing TS Versions

### 1. Struct Initialization
**JavaScript (Working):**
```javascript
const TDeviceIdentification = StructType({
  Name: ArrayType(BYTE, 8),
  ProductCode: ArrayType(BYTE, 16),
  ViewName: ArrayType(BYTE, 100),
});
```

**TypeScript (Failing):**
```typescript
const deviceStruct = require('./ffi-bindings').structs.DeviceIdentification;
```

### 2. FFI Bindings Structure
**JavaScript:**
- Direct struct definitions
- Immediate initialization
- No type abstractions

**TypeScript:**
- Layered type system
- Separate type definitions
- Multiple abstraction levels

## Potential Issues

1. **Struct Constructor Access**
   - Problem: The TypeScript code tries to use structs through an import layer
   - Impact: Constructor pattern doesn't match JavaScript implementation
   - Current state: `deviceStruct is not a constructor` indicates incorrect instantiation

2. **Module Resolution**
   - Problem: Possible mismatch between CommonJS and ES modules
   - Impact: Different import/require behavior
   - Observable in: The way structs are imported and initialized

3. **Type Definition Misalignment**
   - Problem: Type definitions might not match runtime behavior
   - Impact: TypeScript compiler accepts code that fails at runtime
   - Location: ffi-bindings.d.ts vs actual JS implementation

4. **Struct Initialization Pattern**
   - Problem: Different initialization patterns between JS and TS
   - Impact: Constructor pattern fails in TypeScript
   - Critical in: `getConnectedDevices()` method

5. **Buffer Handling**
   - Problem: Different buffer creation patterns
   - Impact: Memory allocation might be incorrect
   - Area: Device identification structure creation

## Key Differences in Implementation

### Device Discovery
JavaScript:
```javascript
const device = new TDeviceIdentification();
```

TypeScript:
```typescript
const device = new deviceStruct();
```

### Memory Management
JavaScript:
- Direct buffer allocation
- Immediate struct initialization

TypeScript:
- Layered buffer management
- Type-safe struct handling

## Possible Solutions

1. **Direct Struct Access**
   - Modify TypeScript to use structs directly like JavaScript version
   - Use `ref-struct-napi` without abstraction layers
   - Match JavaScript initialization pattern

2. **Constructor Pattern Alignment**
   - Ensure struct types are properly exported as constructors
   - Match JavaScript's struct initialization pattern
   - Validate constructor availability at runtime

3. **Module System Adjustment**
   - Review and align module systems (CommonJS vs ES Modules)
   - Ensure consistent import/require behavior
   - Consider using `esModuleInterop` in TypeScript

4. **FFI Binding Restructure**
   - Restructure FFI bindings to match JavaScript pattern
   - Simplify type layer abstraction
   - Ensure constructor pattern works in TypeScript

5. **Type Definition Updates**
   - Update type definitions to match runtime behavior
   - Add proper constructor signatures
   - Ensure struct types are properly defined

## Recommendations for Investigation

1. Compare struct initialization in both versions
2. Debug struct constructor availability at runtime
3. Verify FFI binding patterns match
4. Test struct creation in isolation
5. Review memory management patterns

## Next Steps

1. Compare working JavaScript implementation's struct initialization
2. Test struct creation patterns in isolation
3. Verify FFI binding structure
4. Review type definitions accuracy
5. Consider simplifying TypeScript abstraction

This should give you a good starting point for investigating and fixing the issue tomorrow. The key will be aligning the TypeScript implementation with the working JavaScript patterns while maintaining type safety.