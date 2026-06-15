import { useCallback, useState } from 'react';
import { snapshotApi } from '../api/snapshotApi.js';

export function useSnapshotVerification(initialBatchId = '') {
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [verification, setVerification] = useState(null);
  const [backendSummary, setBackendSummary] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState(null);

  const run = useCallback(async (label, action) => {
    setLoading(label);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading('');
    }
  }, []);

  const generateSnapshot = useCallback(
    (forcedBatchId = batchId) =>
      run('snapshot', async () => {
        const response = await snapshotApi.createSnapshot(forcedBatchId);
        setSnapshot(response.data);
        if (response.data?.verification_code) {
          setVerificationCode(response.data.verification_code);
        }
        return response;
      }),
    [batchId, run]
  );

  const verifyCode = useCallback(
    (forcedCode = verificationCode) =>
      run('verify', async () => {
        const code = String(forcedCode || '').trim();
        const response = await snapshotApi.verify(code);
        setVerification(response.data);
        return response;
      }),
    [run, verificationCode]
  );

  const loadBackendSummary = useCallback(
    () =>
      run('backend-summary', async () => {
        const response = await snapshotApi.backendSummary();
        setBackendSummary(response.data);
        return response;
      }),
    [run]
  );

  return {
    batchId,
    setBatchId,
    verificationCode,
    setVerificationCode,
    snapshot,
    verification,
    backendSummary,
    loading,
    error,
    generateSnapshot,
    verifyCode,
    loadBackendSummary,
  };
}
