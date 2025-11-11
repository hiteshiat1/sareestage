
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './Spinner';
import { GoogleIcon } from './icons/AuthIcons';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isLoginView) {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password);
            }
            onLoginSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleAuth = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await loginWithGoogle();
            onLoginSuccess();
        } catch (err) {
             setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-stone-50 dark:bg-slate-900 p-4 font-sans -m-8">
             <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        SareeStage
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {isLoginView ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}
                    </p>
                 </div>

                <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-lg p-8">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>

                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <Spinner /> : (isLoginView ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                                <GoogleIcon />
                                <span className="ml-2">Google</span>
                            </button>
                        </div>
                    </div>

                     <div className="mt-6 text-center text-sm">
                        <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-fuchsia-600 hover:text-fuchsia-500 dark:text-fuchsia-400">
                            {isLoginView ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
