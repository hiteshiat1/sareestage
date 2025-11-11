
import React, { useState, useEffect } from 'react';
import { SareeTryOnFlow } from './components/SareeTryOnFlow';
import { LegalModal } from './components/LegalModal';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { LogoutIcon, UserIcon } from './components/icons/ActionIcons';
import { PricingScreen } from './components/PricingScreen';
import { useUser } from './contexts/UserContext';

// --- Start of LandingPage Component Definition ---
interface LandingPageProps {
  onStartSaree: () => void;
}

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="flex flex-col items-center p-6 text-center bg-white dark:bg-slate-800 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
);

const Step: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
    <div className="relative flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 border-2 border-fuchsia-500 rounded-full text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
            {number}
        </div>
        <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{description}</p>
    </div>
);

// Basic SVG icons for features
const AiIcon = () => <svg className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const PhotoIcon = () => <svg className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;


const LandingPage: React.FC<LandingPageProps> = ({ onStartSaree }) => {
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
          Virtual Saree Try-On with <span className="text-fuchsia-600 dark:text-fuchsia-400">AI</span>.
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
          See how any saree looks on you before you buy. Upload your photo and the saree images to get a photorealistic result in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <button
             onClick={onStartSaree}
             className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
           >
             Saree Virtual Try-On
           </button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            ✨ Your first <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">3 generations</span> are on us! ✨
        </p>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">What We Offer</h2>
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard 
            title="Virtual Try-On" 
            description="See exactly how a saree looks on you before making a purchase. Our AI drapes it perfectly." 
            icon={<PhotoIcon />}
          />
           <FeatureCard 
            title="Photorealistic Results" 
            description="Experience stunning, high-quality images that respect lighting, shadows, and natural texture." 
            icon={<AiIcon />}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Three Simple Steps</h2>
        <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-300 dark:bg-slate-700"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                <Step number="1" title="Upload Your Photo" description="Choose a clear, full-body picture of yourself." />
                <Step number="2" title="Add Saree Images" description="Provide 1-3 images of the saree you want to try on." />
                <Step number="3" title="Generate Your Look" description="Let our AI work its magic and create your virtual try-on!" />
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center bg-fuchsia-700 dark:bg-fuchsia-900 rounded-lg p-12">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-fuchsia-200 mb-8 max-w-2xl mx-auto">Stop guessing and start visualizing. Bring your dream saree look to life with SareeStage.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartSaree}
            className="bg-white hover:bg-gray-200 text-fuchsia-700 font-bold py-3 px-10 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
          >
            Start Try-On
          </button>
        </div>
        <p className="mt-4 text-sm text-fuchsia-200">
            ✨ Try it out! Your first <span className="font-bold text-white">3 generations</span> are complimentary. ✨
        </p>
      </section>
    </div>
  );
};
// --- End of LandingPage Component Definition ---

type Screen = 'landing' | 'saree' | 'auth' | 'pricing';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { userData, purchasePlan } = useUser();

  const handleNavigate = (targetScreen: Screen) => {
    setScreen(targetScreen);
  };

  const handleStartSaree = () => {
    if (!userData) return; // Wait for user data to load

    if (userData.credits > 0) {
      handleNavigate('saree');
    } else {
      if (currentUser) {
        handleNavigate('pricing');
      } else {
        handleNavigate('auth');
      }
    }
  };
  
  const handleLoginSuccess = () => {
    // After login/signup, a new user will have 0 credits.
    // The logic directs them to the pricing page to continue.
    // If somehow they had credits, they'd go to the saree page.
    if (userData && userData.credits > 0) {
        handleNavigate('saree');
    } else {
        handleNavigate('pricing');
    }
  };

  const handlePlanSelected = () => {
    // After purchasing a plan, the user will have credits.
    // Navigate them directly to the try-on screen to use them.
    handleNavigate('saree');
  };

  const renderContent = () => {
    switch (screen) {
        case 'saree':
             // Protect this screen. Redirect if conditions aren't met.
            if (!userData || userData.credits === 0) {
                // This is a fallback. The `handleStartSaree` should prevent this.
                // We'll redirect to the landing page as a safe default.
                return <LandingPage onStartSaree={handleStartSaree} />;
            }
            return <SareeTryOnFlow onOpenLegal={() => setIsLegalModalOpen(true)} />;
        case 'auth':
            return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
        case 'pricing':
            return <PricingScreen onPlanSelected={handlePlanSelected} />;
        case 'landing':
        default:
            return <LandingPage onStartSaree={handleStartSaree} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200 antialiased">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400 cursor-pointer"
            onClick={() => handleNavigate('landing')}
          >
            SareeStage
          </h1>
          <div className="flex items-center space-x-2 md:space-x-4">
             {screen !== 'landing' && (
                <button onClick={() => handleNavigate('landing')} className="text-sm md:text-base font-medium text-gray-600 hover:text-fuchsia-600 dark:text-gray-400 dark:hover:text-fuchsia-400 transition-colors">
                    Home
                </button>
             )}
             <button onClick={() => handleNavigate('pricing')} className="text-sm md:text-base font-medium text-gray-600 hover:text-fuchsia-600 dark:text-gray-400 dark:hover:text-fuchsia-400 transition-colors">
                Pricing
             </button>
             
             {userData && (
                <div className="bg-fuchsia-100 dark:bg-slate-700 text-fuchsia-700 dark:text-fuchsia-300 text-sm font-bold px-3 py-1 rounded-full">
                    Credits: {userData.credits}
                </div>
             )}

             {currentUser ? (
                <div className="flex items-center space-x-3">
                    <span className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <UserIcon />
                        <span className="ml-1.5">{currentUser.email}</span>
                    </span>
                    <button 
                        onClick={logout} 
                        className="flex items-center text-sm md:text-base font-medium text-gray-600 hover:text-fuchsia-600 dark:text-gray-400 dark:hover:text-fuchsia-400 transition-colors"
                        title="Logout"
                    >
                        <LogoutIcon />
                        <span className="ml-1.5 sm:hidden">Logout</span>
                    </button>
                </div>
             ) : (
                <button 
                    onClick={() => handleNavigate('auth')} 
                    className="text-sm md:text-base font-medium text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 dark:hover:text-fuchsia-500 transition-colors"
                >
                    Login
                </button>
             )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {renderContent()}
      </main>
      <footer className="bg-white dark:bg-slate-800 border-t border-stone-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} SareeStage. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <button onClick={() => setIsLegalModalOpen(true)} className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors">
                    Terms of Service
                </button>
                <button onClick={() => setIsLegalModalOpen(true)} className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors">
                    Privacy Policy
                </button>
            </div>
        </div>
      </footer>
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </div>
  );
}
