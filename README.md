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

## IO-Link Backend API Endpoints

Base URL: http://localhost:3000/api/v1  
WebSocket: ws://localhost:3000/socket.io  
Auth: API Key via header `X-API-Key` or `Authorization: Bearer <key>`  
Roles: read_only, operator, admin

Masters
- GET  /masters — discover masters
- GET  /masters/connected — list connected masters
- POST /masters/connect — connect to a master (body: deviceName / port)
- DELETE /masters/:handle — disconnect master by handle

Devices
- GET  /devices — list all devices
- GET  /devices/:master/:port — get device at master + port
- GET  /devices/:master/:port/status — device status
- GET  /devices/:master/:port/info — device info
- GET  /devices/summary — summary of all devices
- POST /devices/scan — scan devices on a master

Data (process & parameters)
- GET  /data/:master/:port/process — read process data
- POST /data/:master/:port/process — write process data
- GET  /data/:master/:port/process/stream — stream process data
- GET  /data/:master/:port/parameters/:index — read a parameter
- POST /data/:master/:port/parameters/:index — write a parameter
- GET  /data/:master/:port/parameters — list parameters
- GET  /data/:master/:port/parameters/standard — standard parameter list
- POST /data/:master/:port/parameters/batch — batch parameter operations

Streaming (API / docs)
- GET /stream/status — streaming service status
- GET /stream/active — active streams
- GET /stream/documentation — streaming docs
- GET /stream/examples — streaming examples

Masters
````bash
curl -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" http://localhost:3000/api/v1/masters
curl -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" http://localhost:3000/api/v1/masters/connected
curl -X POST -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" -H "Content-Type: application/json" -d '{"deviceName":"COM7"}' http://localhost:3000/api/v1/masters/connect
curl -X DELETE -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" http://localhost:3000/api/v1/masters/1
````

Devices
````bash
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/devices
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/devices/COM7/1
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/devices/COM7/1/status
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/devices/COM7/1/info
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/devices/summary
curl -X POST -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" -H "Content-Type: application/json" -d '{"master":"COM7"}' http://localhost:3000/api/v1/devices/scan
````

Data (process & parameters)
````bash
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/data/COM7/1/process
curl -X POST -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: operator" -H "Content-Type: application/json" -d '{"data":[1,2,3,4]}' http://localhost:3000/api/v1/data/COM7/1/process
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/data/COM7/1/process/stream
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/data/COM7/1/parameters/18
curl -X POST -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: operator" -H "Content-Type: application/json" -d '{"value":"TestDevice"}' http://localhost:3000/api/v1/data/COM7/1/parameters/18
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/data/COM7/1/parameters
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/data/COM7/1/parameters/standard
curl -X POST -H "X-API-Key: dev-api-key-12345" -H "X-User-Role: admin" -H "Content-Type: application/json" -d '{"operations":[{"index":18,"value":"A"},{"index":12,"value":"B"}]}' http://localhost:3000/api/v1/data/COM7/1/parameters/batch
````

Streaming (API / docs)
````bash
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/stream/status
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/stream/active
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/stream/documentation
curl -H "X-API-Key: dev-api-key-12345" http://localhost:3000/api/v1/stream/examples
````
