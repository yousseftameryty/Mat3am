"use client";

// @ts-expect-error - react-qr-code types issue
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";

// Imagine these are your tables
const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Get the current hostname/IP from the browser
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // In production (Vercel), no port needed
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return `${protocol}//${hostname}`;
    }
    
    // In development, use port
    const portStr = port ? `:${port}` : ':3000';
    return `${protocol}//${hostname}${portStr}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default function QRPrintPage() {
  const [baseUrl, setBaseUrl] = useState<string>("http://localhost:3000");
  const [networkIp, setNetworkIp] = useState<string>("");

  useEffect(() => {
    const url = getBaseUrl();
    setBaseUrl(url);
    
    // Extract IP from URL if available
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        setNetworkIp(hostname);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      
      {/* Screen Only Header */}
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-bold mb-2">Table QR Codes</h1>
        <div className="mb-4 space-y-2">
          <p className="text-gray-500">Print this page (Ctrl+P) to get your table stickers.</p>
          <div className={`border rounded-lg p-3 text-sm ${
            baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') ? (
              <>
                <p className="font-semibold text-yellow-900 mb-1">⚠️ Using Localhost</p>
                <p className="text-yellow-700 font-mono break-all mb-2">{baseUrl}</p>
                <p className="text-xs text-yellow-600">
                  <strong>To make QR codes work on other devices:</strong><br />
                  Access this page via: <span className="font-mono bg-yellow-100 px-1 rounded">http://192.168.8.106:3000/admin/qr-code</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-blue-900 mb-1">✅ Network URL Active:</p>
                <p className="text-blue-700 font-mono break-all">{baseUrl}</p>
                <p className="text-xs text-blue-600 mt-1">
                  QR codes will work on all devices on your network!
                </p>
              </>
            )}
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800"
        >
          Print Stickers
        </button>
      </div>

      {/* The Grid of QRs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 print:grid-cols-3 print:gap-4">
        {TABLES.map((tableNum) => (
          <div key={tableNum} className="flex flex-col items-center border-2 border-dashed border-gray-300 p-6 rounded-xl break-inside-avoid">
            <h2 className="text-xl font-black mb-4 uppercase tracking-widest">Table {tableNum}</h2>
            
            <div className="bg-white p-2 rounded-lg shadow-sm">
              {/* @ts-expect-error - react-qr-code component type issue */}
              <QRCode 
                value={`${baseUrl}/table/${tableNum}`} 
                size={150} 
                fgColor="#000000"
                bgColor="#ffffff"
                level="H"
              />
            </div>

            <p className="mt-4 text-xs font-mono text-gray-400">Scan to View Bill</p>
          </div>
        ))}
      </div>
    </div>
  );
}

