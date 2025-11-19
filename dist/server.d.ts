/**
 * Server Entry Point
 * HTTP server startup with Socket.IO integration
 *
 */
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { server, io, app };
//# sourceMappingURL=server.d.ts.map