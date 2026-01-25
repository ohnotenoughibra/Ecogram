import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(''); // For development

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      // In development, the token is returned for testing
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Form */}
        <div className="card p-6">
          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Check your email
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      If an account exists with that email, you'll receive a password reset link shortly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Development: Show reset link */}
              {resetToken && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-2">
                    Development Mode
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    Reset link (copy this):
                  </p>
                  <Link
                    to={`/reset-password/${resetToken}`}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    /reset-password/{resetToken}
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="btn-secondary w-full h-11 flex items-center justify-center"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11"
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
