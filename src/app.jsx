/**
 * Pomodoro Timer - React Frontend
 *
 * This is the main React component that provides the user interface for the
 * Pomodoro Timer application. It handles timer functionality, website blocking
 * controls, and user interactions.
 *
 * Key Features:
 * - Timer management (start, pause, reset)
 * - Website blocking interface
 * - Theme switching (dark/light)
 * - Desktop notifications
 * - Persistent data storage
 * - Professional UI with status feedback
 */

import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import tr from './locales/tr.json';
import en from './locales/en.json';

function App() {
  // State management for timer
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60);

  // State for blocked websites
  const [blockedSites, setBlockedSites] = useState('');
  const [savedSites, setSavedSites] = useState([]);

  // State for persistent blocked list
  const [blockedList, setBlockedList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme state
  const [theme, setTheme] = useState('dark');

  // State for notifications and error handling
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [adminError, setAdminError] = useState(null);

  // State for break session
  const [isBreak, setIsBreak] = useState(false);
  const [breakTime, setBreakTime] = useState(5 * 60); // 5 minutes break
  const [autoBreak, setAutoBreak] = useState(true);

  // Language and translation function
  const [language, setLanguage] = useState('tr');
  const translations = { tr, en };

  const t = (key, replacements = {}) => {
    let translation = translations[language][key] || key;
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{{${placeholder}}}`, replacements[placeholder]);
    });
    return translation;
  };

  // Load saved blocked list on component mount
  useEffect(() => {
    const loadSavedList = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getBlockedList) {
          const response = await window.electronAPI.getBlockedList();
          if (response.success && response.data) {
            setBlockedList(response.data);
            setBlockedSites(response.data.join('\n'));
            setSavedSites(response.data);
            console.log('Loaded saved blocked list:', response.data);
          }
        }
      } catch (error) {
        console.error('Failed to load saved blocked list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedList();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Timer logic with useEffect
  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      const handleTimerEnd = async () => {
        setIsActive(false);

        if (isBreak) {
          setIsBreak(false);
          setTimeLeft(initialTime);
          if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(
              t('notification_breakCompletedTitle'),
              t('notification_breakCompletedBody')
            );
          }
          showNotification(t('breakCompleted'), 'success');
        } else {
          if (window.electronAPI && window.electronAPI.stopBlocking) {
            try {
              const response = await window.electronAPI.stopBlocking();
              if (response.success) {
                showNotification(t('notification_sitesUnblocked'), 'success');
              } else {
                showNotification(t('notification_sitesMayBeBlocked'), 'warning');
              }
            } catch (error) {
              showNotification(t('notification_unblockError'), 'error');
            }
          }
          if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(
              t('notification_pomodoroCompletedTitle'),
              t('notification_pomodoroCompletedBody')
            );
          }
          showNotification(t('pomodoroCompleted'), 'success');

          if (autoBreak) {
            setTimeout(() => {
              setIsBreak(true);
              setTimeLeft(breakTime);
              setIsActive(true);
              showNotification(t('notification_breakSessionStarted'), 'info');
            }, 2000);
          }
        }
      };
      handleTimerEnd();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, isBreak, initialTime, breakTime, autoBreak, t]);

  // Format time display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save blocked sites list to persistent storage
  const handleSaveList = async () => {
    try {
      const sitesArray = blockedSites.split('\n').filter(site => site.trim() !== '');
      if (window.electronAPI && window.electronAPI.setBlockedList) {
        const response = await window.electronAPI.setBlockedList(sitesArray);
        if (response.success) {
          setBlockedList(sitesArray);
          setSavedSites(sitesArray);
          showNotification(t('notification_listSaveSuccess', { count: sitesArray.length }), 'success');
        } else {
          showNotification(t('notification_listSaveError', { error: response.error }), 'error');
        }
      } else {
        setSavedSites(sitesArray);
        showNotification(t('notification_listSaveTemp', { count: sitesArray.length }), 'info');
      }
    } catch (error) {
      console.error('Failed to save blocked list:', error);
      showNotification(t('notification_listSaveFail'), 'error');
    }
  };

  // Timer control functions
  const startTimer = async () => {
    if (adminError) {
      showNotification(adminError, 'error');
      return;
    }
    try {
      setIsActive(true);
      if (!isBreak) {
        const sitesArray = blockedSites.split('\n').filter(site => site.trim() !== '');
        if (sitesArray.length === 0) {
          showNotification(t('notification_emptyBlockList'), 'warning');
          setIsActive(false);
          return;
        }
        if (window.electronAPI && window.electronAPI.startBlocking) {
          const response = await window.electronAPI.startBlocking(sitesArray);
          if (response.success) {
            if (window.electronAPI.showNotification) {
              await window.electronAPI.showNotification(
                t('appTitle'),
                t('notification_focusSessionStarted')
              );
            }
            showNotification(t('notification_focusSessionStarted'), 'success');
          } else {
            setIsActive(false);
            showNotification(t('notification_startError', { error: response.error }), 'error');
          }
        }
      } else {
        if (window.electronAPI.showNotification) {
          await window.electronAPI.showNotification(
            t('notification_breakSessionTitle'),
            t('notification_breakSessionBody')
          );
        }
        showNotification(t('notification_breakSessionStarted'), 'info');
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      setIsActive(false);
      showNotification(t('notification_timerStartError'), 'error');
    }
  };

  const pauseTimer = async () => {
    setIsActive(false);
    if (window.electronAPI && window.electronAPI.stopBlocking) {
      try {
        await window.electronAPI.stopBlocking();
        showNotification(t('notification_sessionPaused'), 'info');
      } catch (error) {
        showNotification(t('notification_unblockFail'), 'error');
      }
    }
  };

  const resetTimer = async () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(initialTime);
    if (window.electronAPI && window.electronAPI.stopBlocking) {
      try {
        await window.electronAPI.stopBlocking();
        showNotification(t('notification_timerReset'), 'info');
      } catch (error) {
        showNotification(t('notification_unblockFail'), 'error');
      }
    }
  };

  const setCustomTime = (minutes) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setInitialTime(seconds);
    setIsActive(false);
    setIsBreak(false);
  };

  // Show notification function
  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, duration);
  };

  // Check admin permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (window.electronAPI && window.electronAPI.checkAdminPermissions) {
          const response = await window.electronAPI.checkAdminPermissions();
          if (!response.success && response.needsAdmin) {
            setAdminError(response.error);
          }
        }
      } catch (error) {
        console.error('Failed to check admin permissions:', error);
      }
    };
    checkPermissions();
  }, []);

  // Manual unblock function
  const handleManualUnblock = async () => {
    try {
      if (window.electronAPI && window.electronAPI.stopBlocking) {
        const response = await window.electronAPI.stopBlocking();
        if (response.success) {
          showNotification(t('notification_manualUnblockSuccess'), 'success', 6000);
        } else {
          showNotification(t('notification_manualUnblockError', { error: response.error }), 'error');
        }
      }
    } catch (error) {
      showNotification(t('notification_manualUnblockFail'), 'error');
    }
  };

  // Force clean hosts file function
  const handleForceCleanHosts = async () => {
    try {
      if (window.electronAPI && window.electronAPI.forceCleanHosts) {
        const response = await window.electronAPI.forceCleanHosts();
        if (response.success) {
          showNotification(t('notification_forceCleanSuccess'), 'success', 6000);
        } else {
          showNotification(t('notification_forceCleanError', { error: response.error }), 'error');
        }
      }
    } catch (error) {
      showNotification(t('notification_forceCleanFail'), 'error');
    }
  };

  const blockedSitesCount = useMemo(() => {
    return blockedSites.split('\n').filter(site => site.trim() !== '').length;
  }, [blockedSites]);

  if (isLoading) {
    return (
      <div className="app">
        <div className="top-bar" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem 0 2rem' }}>
          {/* Language selector can be shown here too if desired */}
        </div>
        <div className="timer-container">
          <div className="loading">
            <h2>⏳ {t('loading')}</h2>
            <p>{t('loadingData')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="top-bar" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '1rem 2rem 0 2rem' }}>
        <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>{t('language')}:</span>
          <select id="lang-select" value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #ccc', fontWeight: 500 }}>
            <option value="tr">{t('turkish')}</option>
            <option value="en">{t('english')}</option>
          </select>
        </div>
      </div>
      <div className="timer-container">
        {adminError && (
          <div className="admin-error">
            <div className="error-card">
              <span className="error-icon">⚠️</span>
              <div className="error-content">
                <h3>{t('adminPermissionRequired')}</h3>
                <p>{adminError}</p>
                <button className="btn btn-error" onClick={() => setAdminError(null)}>
                  {t('ok')}
                </button>
              </div>
            </div>
          </div>
        )}

        {notification.show && (
          <div className={`notification notification-${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' :
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        )}

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <h1 className="title">{isBreak ? t('breakSession') : t('appTitle')}</h1>

        <div className="session-indicator">
          {isBreak ? (
            <span className="break-session">{t('breakSession')}</span>
          ) : (
            <span className="work-session">{t('workSession')}</span>
          )}
        </div>

        <div className="time-display">{formatTime(timeLeft)}</div>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="controls">
          {!isActive ? (
            <button className="btn btn-start" onClick={startTimer}>
              <span className="status-icon">▶️</span> {t('start')}
            </button>
          ) : (
            <button className="btn btn-pause" onClick={pauseTimer}>
              <span className="status-icon">⏸️</span> {t('pause')}
            </button>
          )}
          <button className="btn btn-reset" onClick={resetTimer}>
            <span className="status-icon">🔄</span> {t('reset')}
          </button>
        </div>

        <div className="preset-section">
          <h3>{t('quickSettings')}</h3>
          <div className="preset-buttons">
            <button className="btn-preset" onClick={() => setCustomTime(5)}>{t('duration_5min')}</button>
            <button className="btn-preset" onClick={() => setCustomTime(15)}>{t('duration_15min')}</button>
            <button className="btn-preset" onClick={() => setCustomTime(25)}>{t('duration_25min')}</button>
            <button className="btn-preset" onClick={() => setCustomTime(45)}>{t('duration_45min')}</button>
            <button className="btn-preset" onClick={() => setCustomTime(60)}>{t('duration_60min')}</button>
          </div>
        </div>

        <div className="blocked-sites-section">
          <h3>{t('sitesToBlock')}</h3>
          <textarea
            className="blocked-sites-textarea"
            value={blockedSites}
            onChange={(e) => setBlockedSites(e.target.value)}
            placeholder={t('placeholder_sites')}
            rows={6}
          />
          <button className="btn btn-save" onClick={handleSaveList}>
            <span className="status-icon">💾</span> {t('saveListCount', { count: blockedSitesCount })}
          </button>

          <div className="info-cards">
            {savedSites.length > 0 && (
              <div className="info-card success">
                <p><span className="status-icon">✅</span> {t('sitesSaved', { count: savedSites.length })}</p>
              </div>
            )}
            {blockedList.length > 0 && (
              <div className="info-card primary">
                <p><span className="status-icon">🔒</span> {t('sitesInList', { count: blockedList.length })}</p>
              </div>
            )}
          </div>

          <div className="emergency-controls">
            <button className="btn btn-emergency" onClick={handleManualUnblock} title={t('emergencyAccessTitle')}>
              <span className="status-icon">🚨</span> {t('emergencyAccess')}
            </button>
            <button className="btn btn-force-clean" onClick={handleForceCleanHosts} title={t('forceCleanTitle')}>
              <span className="status-icon">🧹</span> {t('cleanHosts')}
            </button>
          </div>
        </div>

        <div className="break-settings">
          <h3>{t('breakSettings')}</h3>
          <div className="break-controls">
            <label className="checkbox-label">
              <input type="checkbox" checked={autoBreak} onChange={(e) => setAutoBreak(e.target.checked)} />
              <span className="checkmark"></span>
              {t('autoBreak')}
            </label>
            <div className="break-time-selector">
              <label>{t('breakTime')}:</label>
              <select value={breakTime / 60} onChange={(e) => setBreakTime(parseInt(e.target.value, 10) * 60)}>
                <option value={5}>{t('duration_5min_full')}</option>
                <option value={10}>{t('duration_10min_full')}</option>
                <option value={15}>{t('duration_15min_full')}</option>
                <option value={20}>{t('duration_20min_full')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="status">
          {isActive && timeLeft > 0 && !isBreak && (
            <div className="status-card active"><p><span className="status-icon">🎯</span> {t('focusModeActive')}</p></div>
          )}
          {isActive && timeLeft > 0 && isBreak && (
            <div className="status-card break"><p><span className="status-icon">☕</span> {t('breakModeActive')}</p></div>
          )}
          {!isActive && timeLeft < initialTime && timeLeft > 0 && (
            <div className="status-card paused"><p><span className="status-icon">⏸️</span> {t('pausedMode')}</p></div>
          )}
          {timeLeft === 0 && (
            <div className="status-card completed"><p><span className="status-icon">🎉</span> {isBreak ? t('breakCompleted') : t('pomodoroCompleted')}</p></div>
          )}
          {timeLeft === initialTime && !isActive && (
            <div className="status-card"><p><span className="status-icon">⚡</span> {t('readyToStart')}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;