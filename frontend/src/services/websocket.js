class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket('wss://sentinel-api-bqfm.onrender.com/ws/alerts');

    this.ws.onopen = () => {
      console.log('Connected to Sentinel Real-Time Surveillance WebSocket');
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.notifySubscribers(payload);
      } catch (err) {
        console.error('Error parsing WebSocket payload:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('Sentinel WebSocket disconnected. Reconnecting in 3s...');
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      this.ws.close();
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Subscriber callback error:', e);
      }
    });
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const wsService = new WebSocketService();
