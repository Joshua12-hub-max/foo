using Fleck;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BioMiddleware.Services
{
    public class BioWebSocketServer
    {
        private WebSocketServer _server;
        private List<IWebSocketConnection> _sockets;
        
        // Events to notify Form1
        public event Action<string>? OnEnrollStart; // payload: "id|name"
        public event Action? OnEnrollCancel;
        public event Action<IWebSocketConnection>? OnClientConnected;
        public event Action? OnResetDevice;
        
        public BioWebSocketServer(int port = 4649)
        {
            _sockets = new List<IWebSocketConnection>();
            _server = new WebSocketServer($"ws://0.0.0.0:{port}");
        }

        public void Start()
        {
            try 
            {
                _server.Start(socket =>
                {
                    socket.OnOpen = () => 
                    {
                        Console.WriteLine("WS Connected");
                        _sockets.Add(socket);
                        socket.Send("CONNECTED");
                        OnClientConnected?.Invoke(socket);
                    };
                    
                    socket.OnClose = () => 
                    {
                        Console.WriteLine("WS Disconnected");
                        _sockets.Remove(socket);
                    };
                    
                    socket.OnMessage = message => HandleMessage(message, socket);
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("WS Error: " + ex.Message);
            }
        }

        public void Broadcast(string message)
        {
            foreach (var socket in _sockets.ToList())
            {
                socket.Send(message);
            }
        }

        private void HandleMessage(string message, IWebSocketConnection socket)
        {
            message = (message ?? "").Trim();
            Console.WriteLine($"WS RECV: '{message}'");
            Broadcast($"DEBUG: Received '{message}'");

            if (message.StartsWith("ENROLL_START:"))
            {
                var payload = message.Substring("ENROLL_START:".Length);
                Console.WriteLine($"WS PAYLOAD: '{payload}'");
                OnEnrollStart?.Invoke(payload);
            }
            else if (message == "ENROLL_CANCEL")
            {
                OnEnrollCancel?.Invoke();
            }
            else if (message == "RESET_DEVICE")
            {
                OnResetDevice?.Invoke();
            }
            else if (message == "PING")
            {
                socket.Send("PONG");
            }
        }

        public void Dispose()
        {
            try 
            {
                foreach(var s in _sockets) s.Close();
                _server.Dispose();
            }
            catch {}
        }
    }
}
