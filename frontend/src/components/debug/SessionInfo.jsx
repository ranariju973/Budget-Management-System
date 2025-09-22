import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { cookieUtils } from '../utils/cookies';

const SessionInfo = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const tokenFromCookie = cookieUtils.getCookie('token');
  const tokenFromLocalStorage = localStorage.getItem('token');

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 max-w-sm">
      <div className="font-semibold mb-1">Session Info (Dev Mode)</div>
      <div>User: {user?.name}</div>
      <div>Cookie Token: {tokenFromCookie ? 'Set ✅' : 'None ❌'}</div>
      <div>LocalStorage Token: {tokenFromLocalStorage ? 'Set ✅' : 'None ❌'}</div>
      <div className="text-xs text-blue-600 mt-1">
        Session expires in 7 days from login
      </div>
    </div>
  );
};

export default SessionInfo;