import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  CheckIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
  const { user, logout } = useAuth();

  const features = [
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Smart Budget Tracking",
      description: "Create and manage multiple budgets with intelligent categorization and real-time expense tracking."
    },
    {
      icon: <CurrencyDollarIcon className="w-8 h-8" />,
      title: "Expense Management",
      description: "Track daily expenses with detailed categories, notes, and automatic calculations for better financial control."
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your financial data is encrypted and secure. We prioritize your privacy with industry-standard security measures."
    },
    {
      icon: <DevicePhoneMobileIcon className="w-8 h-8" />,
      title: "Mobile Responsive",
      description: "Access your budgets anywhere, anytime. Our responsive design works perfectly on all devices."
    }
  ];

  const benefits = [
    "Create unlimited budgets for different purposes",
    "Track expenses with detailed categorization",
    "Monitor borrowings and lendings",
    "Day-wise transaction navigation",
    "Real-time budget analysis and insights",
    "Secure user authentication",
    "Export and backup your financial data"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Budget Manager</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                // Logged in user navigation
                <>
                  <div className="hidden sm:flex items-center space-x-2 text-gray-700">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base">Hi, {user.name}!</span>
                  </div>
                  <Link 
                    to="/dashboard" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base px-2 py-1"
                  >
                    Logout
                  </button>
                </>
              ) : (
                // Guest user navigation
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base px-2 py-1"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="text-center sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              {user ? (
                // Personalized content for logged-in users
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                    Welcome back,
                    <span className="block text-blue-600">{user.name}!</span>
                  </h1>
                  <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-prose mx-auto lg:mx-0">
                    Ready to continue managing your financial goals? Access your dashboard to view your budgets, track expenses, and monitor your progress.
                  </p>
                  <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4 max-w-sm mx-auto lg:mx-0">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </div>
                </>
              ) : (
                // Default content for guests
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                    Take Control of Your
                    <span className="block text-blue-600 mt-1">Financial Future</span>
                  </h1>
                  <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-prose mx-auto lg:mx-0">
                    Manage your budgets, track expenses, and monitor your financial goals with our intuitive and powerful budget management platform.
                  </p>
                  <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4 max-w-sm mx-auto lg:mx-0">
                    <Link 
                      to="/register" 
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <span>Start Free Today</span>
                      <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link 
                      to="/login" 
                      className="flex items-center justify-center border-2 border-gray-300 hover:border-gray-400 active:border-gray-500 text-gray-700 hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 bg-white hover:bg-gray-50"
                    >
                      Try Demo
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="p-8">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                      <h3 className="text-xl font-semibold mb-4">Monthly Budget Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Income</span>
                          <span className="font-semibold">$5,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expenses</span>
                          <span className="font-semibold">$3,250</span>
                        </div>
                        <div className="border-t border-blue-400 pt-2 flex justify-between">
                          <span>Remaining</span>
                          <span className="font-bold text-green-200">$1,750</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Food & Dining</span>
                        <span className="font-medium">$850</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Transportation</span>
                        <span className="font-medium">$420</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Entertainment</span>
                        <span className="font-medium">$300</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Everything you need to manage your finances
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive budget management tools help you stay on top of your finances with ease and confidence.
            </p>
          </div>
          <div className="mt-10 sm:mt-12 lg:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 group-hover:bg-blue-200 rounded-xl mx-auto mb-3 sm:mb-4 transition-colors duration-200">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Why choose Budget Manager?
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Start Your Financial Journey</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">1</div>
                    <span className="text-sm sm:text-base text-gray-700">Create your free account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">2</div>
                    <span className="text-gray-700">Set up your first budget</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-gray-700">Start tracking your expenses</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <span className="text-gray-700">Achieve your financial goals</span>
                  </div>
                </div>
                <Link 
                  to="/register" 
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center block transition-colors"
                >
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to take control of your finances?
          </h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of users who have already transformed their financial habits with Budget Manager.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-6 max-w-md mx-auto p-4 bg-blue-500 rounded-lg border border-blue-400">
            <p className="text-sm font-medium text-white mb-2">Try Demo Account</p>
            <div className="text-sm text-blue-100">
              <p className="font-mono">Email: john.doe@example.com</p>
              <p className="font-mono">Password: password123</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CurrencyDollarIcon className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold">Budget Manager</span>
            </div>
            <p className="text-gray-400 mb-6">
              Your trusted partner in financial management and budget planning.
            </p>
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-500 text-sm">
                © 2025 Budget Manager. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;