/**
 * Stream Routes - TypeScript Port
 * Express routes for streaming and real-time operations
 * 
 * CRITICAL: Maintains exact routing behavior from JavaScript version
 */

import express, { Router, Request, Response } from 'express';

// Import middleware
import {
  validateMasterHandle,
  validateDeviceId,
  validateStreamParams,
} from '../middleware/validation';
import {
  requireReadAccess,
  authorizeDeviceAccess,
} from '../middleware/auth';

const router: Router = express.Router();

// ============================================================================
// STREAMING STATUS AND MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/v1/stream/status
 * Get streaming system status
 */
router.get('/status', requireReadAccess, (req: Request, res: Response) => {
  const streamController = require('../controllers/streamController');

  const activeStreamCount = streamController.activeStreams.size;
  const deviceStreamCount = streamController.deviceStreams.size;
  const intervalCount = streamController.streamIntervals.size;

  // Group streams by type
  const streamsByType: Record<string, number> = {};
  for (const [streamId, streamInfo] of streamController.activeStreams) {
    const type = streamInfo.type;
    if (!streamsByType[type]) streamsByType[type] = 0;
    streamsByType[type]++;
  }

  res.json({
    success: true,
    data: {
      status: 'active',
      activeStreams: activeStreamCount,
      deviceStreams: deviceStreamCount,
      activeIntervals: intervalCount,
      streamsByType: streamsByType,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/v1/stream/active
 * Get list of active streams
 */
router.get('/active', requireReadAccess, (req: Request, res: Response) => {
  const streamController = require('../controllers/streamController');

  const streams = Array.from(streamController.activeStreams.entries()).map(
    (entry: any) => {
      const [streamId, info] = entry;
      return {
        streamId,
        type: info.type,
        deviceKey: info.deviceKey,
        socketId: info.socketId,
        interval: info.interval,
        startedAt: info.startedAt,
        uptime: new Date().getTime() - new Date(info.startedAt).getTime(),
        ...(info.parameterIndex !== undefined && {
          parameterIndex: info.parameterIndex,
          subIndex: info.subIndex,
        }),
      };
    }
  );

  res.json({
    success: true,
    data: streams,
    count: streams.length,
  });
});

// ============================================================================
// DEVICE STREAMING ROUTES (HTTP-based alternatives)
// ============================================================================

/**
 * GET /api/v1/stream/:masterHandle/:deviceId/device
 * Get device streaming endpoint info
 */
router.get(
  '/:masterHandle/:deviceId/device',
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  (req: Request, res: Response) => {
    const { masterHandle, deviceId } = req.params;
    const deviceKey = `${masterHandle}:${deviceId}`;

    res.json({
      success: true,
      data: {
        deviceKey: deviceKey,
        websocketEvents: {
          subscribe: 'subscribe:device',
          unsubscribe: 'unsubscribe',
          dataEvent: 'device:data',
          errorEvent: 'device:error',
        },
        subscriptionPayload: {
          masterHandle: parseInt(masterHandle),
          deviceId: parseInt(deviceId),
          interval: 1000, // optional, default 1000ms
        },
        instructions:
          'Connect to WebSocket and emit "subscribe:device" with the subscription payload',
      },
    });
  }
);

/**
 * GET /api/v1/stream/:masterHandle/:deviceId/process-data
 * Get process data streaming endpoint info
 */
router.get(
  '/:masterHandle/:deviceId/process-data',
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  (req: Request, res: Response) => {
    const { masterHandle, deviceId } = req.params;
    const deviceKey = `${masterHandle}:${deviceId}`;

    res.json({
      success: true,
      data: {
        deviceKey: deviceKey,
        websocketEvents: {
          subscribe: 'subscribe:process-data',
          unsubscribe: 'unsubscribe',
          dataEvent: 'process-data:value',
          errorEvent: 'process-data:error',
        },
        subscriptionPayload: {
          masterHandle: parseInt(masterHandle),
          deviceId: parseInt(deviceId),
          interval: 1000, // optional, default 1000ms
        },
        instructions:
          'Connect to WebSocket and emit "subscribe:process-data" with the subscription payload',
      },
    });
  }
);

/**
 * GET /api/v1/stream/:masterHandle/:deviceId/parameters/:index
 * Get parameter streaming endpoint info
 */
router.get(
  '/:masterHandle/:deviceId/parameters/:index',
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  (req: Request, res: Response) => {
    const { masterHandle, deviceId, index } = req.params;
    const { subIndex = 0 } = req.query;
    const deviceKey = `${masterHandle}:${deviceId}`;

    res.json({
      success: true,
      data: {
        deviceKey: deviceKey,
        parameterIndex: parseInt(index),
        subIndex: parseInt(subIndex as string),
        websocketEvents: {
          subscribe: 'subscribe:parameter',
          unsubscribe: 'unsubscribe',
          dataEvent: 'parameter:value',
          errorEvent: 'parameter:error',
        },
        subscriptionPayload: {
          masterHandle: parseInt(masterHandle),
          deviceId: parseInt(deviceId),
          parameterIndex: parseInt(index),
          subIndex: parseInt(subIndex as string),
          interval: 5000, // optional, default 5000ms for parameters
        },
        instructions:
          'Connect to WebSocket and emit "subscribe:parameter" with the subscription payload',
      },
    });
  }
);

// ============================================================================
// STREAMING DOCUMENTATION ROUTES
// ============================================================================

/**
 * GET /api/v1/stream/documentation
 * Get comprehensive streaming API documentation
 */
router.get('/documentation', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      websocketUrl: '/socket.io',
      events: {
        connection: {
          description: 'Client connects to WebSocket',
          clientEmits: 'connect',
          serverEmits: 'connected',
        },
        deviceSubscription: {
          description: 'Subscribe to all device data (process data + status)',
          clientEmits: 'subscribe:device',
          serverEmits: ['device:data', 'device:error', 'subscribed'],
          payload: {
            masterHandle: 'number (required)',
            deviceId: 'number (required)',
            interval: 'number (optional, default 1000ms)',
          },
        },
        processDataSubscription: {
          description: 'Subscribe to process data only',
          clientEmits: 'subscribe:process-data',
          serverEmits: [
            'process-data:value',
            'process-data:error',
            'subscribed',
          ],
          payload: {
            masterHandle: 'number (required)',
            deviceId: 'number (required)',
            interval: 'number (optional, default 1000ms)',
          },
        },
        parameterSubscription: {
          description: 'Subscribe to specific parameter updates',
          clientEmits: 'subscribe:parameter',
          serverEmits: ['parameter:value', 'parameter:error', 'subscribed'],
          payload: {
            masterHandle: 'number (required)',
            deviceId: 'number (required)',
            parameterIndex: 'number (required)',
            subIndex: 'number (optional, default 0)',
            interval: 'number (optional, default 5000ms)',
          },
        },
        unsubscription: {
          description: 'Unsubscribe from specific stream',
          clientEmits: 'unsubscribe',
          serverEmits: 'unsubscribed',
          payload: {
            type: 'string (device|process-data|parameter)',
            deviceKey: 'string (masterHandle:deviceId)',
            parameterIndex: 'number (for parameter type)',
            subIndex: 'number (for parameter type)',
          },
        },
        unsubscribeAll: {
          description: 'Unsubscribe from all streams',
          clientEmits: 'unsubscribe:all',
          serverEmits: 'unsubscribed:all',
        },
        getSubscriptions: {
          description: 'Get current subscriptions for this socket',
          clientEmits: 'get:subscriptions',
          serverEmits: 'subscriptions',
        },
      },
      limits: {
        minInterval: '100ms',
        maxInterval: '60000ms (1 minute)',
        defaultProcessDataInterval: '1000ms',
        defaultParameterInterval: '5000ms',
      },
      examples: {
        javascriptClient: {
          connect: "const socket = io('ws://localhost:3000');",
          subscribeDevice:
            "socket.emit('subscribe:device', { masterHandle: 1, deviceId: 1, interval: 1000 });",
          subscribeParameter:
            "socket.emit('subscribe:parameter', { masterHandle: 1, deviceId: 1, parameterIndex: 15, interval: 5000 });",
          handleData:
            "socket.on('device:data', (data) => { console.log('Device data:', data); });",
          unsubscribe:
            "socket.emit('unsubscribe', { type: 'device', deviceKey: '1:1' });",
        },
      },
    },
  });
});

/**
 * GET /api/v1/stream/examples
 * Get example client code for different platforms
 */
router.get('/examples', (req: Request, res: Response) => {
  const { platform = 'javascript' } = req.query;

  const examples: Record<string, any> = {
    javascript: {
      description: 'JavaScript WebSocket client example',
      dependencies: ['socket.io-client'],
      code: `
const io = require('socket.io-client');

// Connect to server
const socket = io('ws://localhost:3000');

// Handle connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
  
  // Subscribe to device data
  socket.emit('subscribe:device', {
    masterHandle: 1,
    deviceId: 1,
    interval: 1000
  });
});

// Handle device data
socket.on('device:data', (data) => {
  console.log('Device data received:', data);
});

// Handle errors
socket.on('device:error', (error) => {
  console.error('Device error:', error);
});

// Handle subscription confirmation
socket.on('subscribed', (info) => {
  console.log('Subscribed to:', info);
});

// Cleanup on exit
process.on('SIGINT', () => {
  socket.emit('unsubscribe:all');
  socket.disconnect();
  process.exit();
});
        `,
    },
    python: {
      description: 'Python WebSocket client example',
      dependencies: ['python-socketio', 'requests'],
      code: `
import socketio
import time

# Create socket client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')
    
    # Subscribe to device data
    sio.emit('subscribe:device', {
        'masterHandle': 1,
        'deviceId': 1,
        'interval': 1000
    })

@sio.event
def connected(data):
    print('Server confirmed connection:', data)

@sio.on('device:data')
def on_device_data(data):
    print('Device data received:', data)

@sio.on('device:error')
def on_device_error(error):
    print('Device error:', error)

@sio.on('subscribed')
def on_subscribed(info):
    print('Subscribed to:', info)

# Connect to server
sio.connect('ws://localhost:3000')

try:
    # Keep alive
    sio.wait()
except KeyboardInterrupt:
    sio.emit('unsubscribe:all')
    sio.disconnect()
        `,
    },
  };

  const example = examples[platform as string];
  if (!example) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported platform',
      supportedPlatforms: Object.keys(examples),
    });
  }

  res.json({
    success: true,
    data: {
      platform: platform,
      ...example,
    },
  });
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
