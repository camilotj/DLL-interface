/**
 * Server Entry Point - TypeScript Port
 * HTTP server startup with Socket.IO integration
 *
 * CRITICAL: Maintains exact server behavior from JavaScript version
 */
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { server, io, app };
//# sourceMappingURL=server.d.ts.map