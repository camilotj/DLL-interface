/**
 * HTTP and WebSocket Server
 * Main server entry point
 */
import { Server } from 'http';
import { app } from './app';
declare const server: Server;
declare const io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { server, app, io };
//# sourceMappingURL=server.d.ts.map