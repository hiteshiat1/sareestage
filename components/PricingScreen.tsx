
import React from 'react';
import { useUser } from '../contexts/UserContext';

const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-fuchsia-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

interface PricingCardProps {
  plan: string;
  price: string;
  frequency: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaAction: () => void;
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, frequency, description, features, ctaText, ctaAction, isPopular }) => (
    <div className={`relative flex flex-col p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 transition-transform duration-300 transform hover:scale-105 ${isPopular ? 'border-fuchsia-500' : 'border-transparent'}`}>
        {isPopular && (
            <div className="absolute top-0 -translate-y-1/2 bg-fuchsia-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
            </div>
        )}
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        <p className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {price}
            <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">{frequency}</span>
        </p>
        
        <ul role="list" className="mt-8 space-y-4 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                    <CheckIcon />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                </li>
            ))}
        </ul>

        <button
            onClick={ctaAction}
            className={`mt-10 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors ${isPopular ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700' : 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 dark:bg-slate-700 dark:text-fuchsia-300 dark:hover:bg-slate-600'}`}
        >
            {ctaText}
        </button>
    </div>
);

interface Plan {
    key: string;
    name: string;
    credits: number;
}
  
const PLAN_DETAILS: { [key: string]: Plan } = {
    spark: { key: 'spark', name: 'Creative Spark', credits: 10 },
    enthusiast: { key: 'enthusiast', name: 'Style Enthusiast', credits: 50 },
    pro: { key: 'pro', name: 'Boutique Pro', credits: 200 },
};

interface PricingScreenProps {
    onPlanSelected: () => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onPlanSelected }) => {
    const { purchasePlan } = useUser();
    
    const handlePurchase = (plan: Plan) => {
        purchasePlan(plan.key, plan.credits);
        onPlanSelected();
    };

    const plans = [
        {
            plan: 'Creative Spark',
            price: '$10',
            frequency: '/ one-time',
            description: 'Perfect for a single project or trying us out.',
            features: [
                `${PLAN_DETAILS.spark.credits} Generations`,
                'Pay as you Go',
                'High-Resolution Downloads',
            ],
            ctaText: 'Purchase Now',
            ctaAction: () => handlePurchase(PLAN_DETAILS.spark),
            isPopular: false,
        },
        {
            plan: 'Style Enthusiast',
            price: '$29.99',
            frequency: '/ month',
            description: 'For the dedicated fashion lover and content creator.',
            features: [
                `${PLAN_DETAILS.enthusiast.credits} Generations per month`,
                'Annual Billing Discounts',
                'Priority Queue Access',
                'Cancel anytime',
            ],
            ctaText: 'Subscribe Now',
            ctaAction: () => handlePurchase(PLAN_DETAILS.enthusiast),
            isPopular: true,
        },
        {
            plan: 'Boutique Pro',
            price: '$100',
            frequency: '/ month',
            description: 'Empower your business with high-volume generation.',
            features: [
                `${PLAN_DETAILS.pro.credits}+ Generations per month`,
                'Annual Billing Discounts',
                'Commercial use rights',
                'Dedicated email support',
            ],
            ctaText: 'Contact Us',
            ctaAction: () => { window.location.href = 'mailto:sales@sareestage.com'; },
            isPopular: false,
        }
    ];
    
    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                        Unlock Your Vision
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                        Choose the plan that perfectly fits your creative journey.
                    </p>
                </div>
                
                <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
                   {plans.map((p, i) => (
                       <PricingCard key={i} {...p} />
                   ))}
                </div>
            </div>
        </div>
    );
};