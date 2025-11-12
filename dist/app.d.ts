/**
 * Express Application Configuration - TypeScript Port
 * Main Express app setup with middleware and route configuration
 *
 * CRITICAL: Maintains exact application behavior from JavaScript version
 */
import { Application } from 'express';
import { Server } from 'http';
declare const app: Application;
export { app };
export declare function setServer(serverInstance: Server): void;
//# sourceMappingURL=app.d.ts.map