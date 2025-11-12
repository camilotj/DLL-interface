/**
 * Stream Controller - TypeScript Port
 * Handles real-time streaming operations via WebSocket
 *
 * CRITICAL: Maintains exact controller behavior from JavaScript version
 */
import { Socket, Server as SocketIOServer } from 'socket.io';
interface StreamInfo {
    type: 'device' | 'parameter' | 'process-data';
    socketId: string;
    deviceKey: string;
    masterHandle: number;
    deviceId: number;
    interval: number;
    startedAt: Date;
    parameterIndex?: number;
    subIndex?: number;
}
export declare const activeStreams: Map<string, StreamInfo>;
export declare const deviceStreams: Map<string, Set<string>>;
export declare const streamIntervals: Map<string, NodeJS.Timeout>;
/**
 * Handle new WebSocket connection
 */
export declare function handleConnection(socket: Socket, io: SocketIOServer): void;
export {};
//# sourceMappingURL=streamController.d.ts.map