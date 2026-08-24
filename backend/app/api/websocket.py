from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        """Broadcast real-time watchlist match / detection alert to all connected operators"""
        message = json.dumps({
            "type": "WATCHLIST_ALERT",
            "data": alert_data
        }, default=str)
        
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket client: {e}")
                dead_connections.append(connection)
                
        for dc in dead_connections:
            self.disconnect(dc)

    async def broadcast_detection(self, detection_data: Dict[str, Any]):
        """Broadcast live camera detection feed update"""
        message = json.dumps({
            "type": "LIVE_DETECTION",
            "data": detection_data
        }, default=str)
        
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                dead_connections.append(connection)
                
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()
