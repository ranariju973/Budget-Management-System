import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const SetuLinkButton = ({ onConnectionSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/setu/connection-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking Setu connection status:', error);
    }
  };

  const handleSetuConnection = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/setu/create-link', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.link_url) {
        // Open Setu authorization in a popup window
        const popup = window.open(
          data.link_url,
          'setu-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Poll for popup closure or message
        const pollTimer = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer);
              setIsLoading(false);
              
              // Check for connection success by monitoring URL parameters
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.get('setu_connected') === 'true') {
                onConnectionSuccess && onConnectionSuccess();
                checkConnectionStatus();
                
                // Clean up URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
              } else if (urlParams.get('error')) {
                const error = urlParams.get('error');
                onError && onError(`Connection failed: ${error}`);
                
                // Clean up URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                // Popup was closed without clear success/failure
                setTimeout(checkConnectionStatus, 1000);
              }
            }
          } catch {
            // Popup might be on different domain, ignore cross-origin errors
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
          }
          clearInterval(pollTimer);
          setIsLoading(false);
        }, 300000);

      } else {
        throw new Error(data.error || 'Failed to create Setu authorization link');
      }
    } catch (error) {
      console.error('Setu connection error:', error);
      onError && onError(error.message);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/setu/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus({ connected: false, hasTokens: false });
        onConnectionSuccess && onConnectionSuccess();
      }
    } catch (error) {
      console.error('Error disconnecting Setu:', error);
      onError && onError('Failed to disconnect bank account');
    }
  };

  // Check URL parameters on component mount for OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('setu_connected') === 'true') {
      onConnectionSuccess && onConnectionSuccess();
      checkConnectionStatus();
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      onError && onError(`Connection failed: ${error}`);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onConnectionSuccess, onError]);

  if (connectionStatus?.connected && !connectionStatus?.needsReconnection) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Indian Bank Connected (Setu)
            </p>
            <p className="text-xs text-green-600">
              Ready to import transactions from Indian banks
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (connectionStatus?.needsReconnection) {
    return (
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Bank Connection Expired
            </p>
            <p className="text-xs text-yellow-600">
              Please reconnect your Indian bank account
            </p>
          </div>
        </div>
        <button
          onClick={handleSetuConnection}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Connecting...' : 'Reconnect'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <ArrowTopRightOnSquareIcon className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            Connect Indian Bank Account (Setu)
          </h3>
          <p className="text-xs text-blue-600 mb-3">
            Securely connect your Indian bank account to automatically import transactions. 
            Supports all major Indian banks including SBI, HDFC, ICICI, Axis Bank, and more.
          </p>
          <button
            onClick={handleSetuConnection}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                Connect Indian Bank
              </>
            )}
          </button>
          
          <div className="mt-3 text-xs text-blue-500">
            <p>✓ Bank-grade security (256-bit encryption)</p>
            <p>✓ Read-only access to transaction data</p>
            <p>✓ No storage of banking credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetuLinkButton;