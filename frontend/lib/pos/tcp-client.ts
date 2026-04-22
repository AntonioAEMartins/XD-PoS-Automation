// Browser stand-in for src/clients/tcp_client.py. Real TCP sockets aren't
// available from a web page, so sendData delegates to the in-process
// MockPoSServer after a small simulated latency.
//
// The Python client chunks the socket read in 1024-byte slices and concatenates
// until [EOM] or MESSAGEOK appears (tcp_client.py:66-94). That's a TCP artifact;
// in-process we can hand back the full response string in one shot — the same
// bytes are produced and the [EOM] check in is_end_of_message passes trivially.

import { MockPoSServer } from "@/lib/pos/mock-pos-server";

type SendOpts = {
  latencyMs?: number;
};

function defaultLatency(): number {
  return 30 + Math.random() * 50;
}

export class TCPClient {
  private static _instance: TCPClient | null = null;

  static getInstance(): TCPClient {
    if (!TCPClient._instance) {
      TCPClient._instance = new TCPClient();
    }
    return TCPClient._instance;
  }

  async sendData(message: string, opts: SendOpts = {}): Promise<string> {
    const latency = opts.latencyMs ?? defaultLatency();
    if (latency > 0) {
      await new Promise((r) => setTimeout(r, latency));
    }
    return MockPoSServer.getInstance().handle(message);
  }
}
