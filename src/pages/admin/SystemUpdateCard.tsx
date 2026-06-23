import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { systemAPI, type UpdateCheck } from '../../api/systemAPI';
import toast from 'react-hot-toast';

export const SystemUpdateCard: React.FC = () => {
  const { token } = useAdminStore();
  const { t } = useTranslation();

  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [info, setInfo] = useState<UpdateCheck | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLog = useCallback(async () => {
    if (!token) return '';
    const res = await systemAPI.updateLog(token);
    const text = res.ok ? res.data.log ?? '' : '';
    setLog(text);
    return text;
  }, [token]);

  const toggleLog = async () => {
    if (!showLog && log === null) await fetchLog();
    setShowLog((v) => !v);
  };

  const runCheck = useCallback(async () => {
    if (!token) return;
    setChecking(true);
    const res = await systemAPI.checkUpdate(token);
    if (res.ok) setInfo(res.data);
    else setInfo({ updateAvailable: false, error: res.data.error || t('admin.settings.update.checkFailed') });
    setChecking(false);
    // `t` намеренно не в зависимостях: useTranslation отдаёт новую функцию на
    // каждый рендер, иначе колбэк (и эффект проверки) зацикливаются.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    runCheck();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [runCheck]);

  // Опрашиваем статус, пока обновление не завершится. Сервер на время рестарта
  // недоступен — это ожидаемо, просто продолжаем опрос до таймаута.
  const pollStatus = useCallback(() => {
    if (!token) return;
    const startedAt = Date.now();
    const MAX_MS = 5 * 60 * 1000;

    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > MAX_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setUpdating(false);
        toast.error(t('admin.settings.update.failed'));
        return;
      }
      const res = await systemAPI.updateStatus(token);
      if (!res.ok) return; // сервер ещё перезапускается

      if (res.data.state === 'success') {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.success(t('admin.settings.update.success'));
        // Перезагружаем страницу, чтобы подхватить новую сборку фронтенда.
        setTimeout(() => window.location.reload(), 1500);
      } else if (res.data.state === 'error') {
        if (pollRef.current) clearInterval(pollRef.current);
        setUpdating(false);
        toast.error(t('admin.settings.update.failed'));
        // Подтягиваем журнал и раскрываем его, чтобы причина была видна в UI.
        await fetchLog();
        setShowLog(true);
      }
    }, 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fetchLog]);

  const handleUpdate = async () => {
    if (!token) return;
    setUpdating(true);
    const res = await systemAPI.startUpdate(token);
    if (res.ok && res.data.started) {
      toast.success(t('admin.settings.update.started'));
      pollStatus();
    } else {
      setUpdating(false);
      toast.error(res.data.error || t('admin.settings.update.failed'));
    }
  };

  const available = info?.updateAvailable === true;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Download className="w-6 h-6 text-primary-500" />
        <h2 className="text-xl font-semibold">{t('admin.settings.update.title')}</h2>
      </div>

      <div className="mb-4">
        {checking ? (
          <p className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {t('admin.settings.update.checking')}
          </p>
        ) : info?.error ? (
          <p className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="w-4 h-4" /> {info.error}
          </p>
        ) : available ? (
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
              <AlertCircle className="w-4 h-4" /> {t('admin.settings.update.available')}
            </p>
            <p className="text-sm text-dark-600 dark:text-dark-400">
              {t('admin.settings.update.currentVersion')}: <code>{info?.current}</code>
              {' → '}
              {t('admin.settings.update.latestVersion')}: <code>{info?.latest}</code>
              {typeof info?.behind === 'number' ? ` (+${info.behind})` : ''}
            </p>
            {info?.latestSubject && (
              <p className="text-sm text-dark-500 truncate">«{info.latestSubject}»</p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" /> {t('admin.settings.update.upToDate')}
            {info?.current ? <code className="text-dark-500">{info.current}</code> : null}
          </p>
        )}
      </div>

      <p className="text-xs text-dark-500 mb-4">{t('admin.settings.update.note')}</p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={runCheck} disabled={checking || updating} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {t('admin.settings.update.check')}
        </Button>
        <Button onClick={handleUpdate} disabled={!available || updating || checking} className="gap-2">
          {updating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t('admin.settings.update.updating')}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t('admin.settings.update.updateNow')}
            </>
          )}
        </Button>

        <Button variant="ghost" onClick={toggleLog} disabled={updating} className="gap-2">
          <FileText className="w-4 h-4" />
          {showLog ? t('admin.settings.update.hideLog') : t('admin.settings.update.showLog')}
        </Button>
      </div>

      {showLog && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">{t('admin.settings.update.log')}</p>
          <pre className="max-h-72 overflow-auto rounded-lg bg-dark-900 text-dark-100 dark:bg-black text-xs p-3 whitespace-pre-wrap break-words">
            {log && log.trim().length > 0 ? log : t('admin.settings.update.noLog')}
          </pre>
        </div>
      )}
    </Card>
  );
};
