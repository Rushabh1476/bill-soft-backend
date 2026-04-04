import React, { useState, useEffect } from 'react';
import { simplifiedFeatureFlagService } from '../../services/simplifiedFeatureFlagService';

interface SecurityFeature {
  name: string;
  displayName: string;
  enabled: boolean;
  isPaidFeature: boolean;
  requiredPlan?: string;
}

const SecurityDashboard: React.FC = () => {
  const [features, setFeatures] = useState<SecurityFeature[]>([]);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const allFeatures = await simplifiedFeatureFlagService.getAllFeatures();
      setFeatures(allFeatures);
      setError(null);
    } catch (err) {
      setError('Failed to load security features');
      console.error('Error loading features:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const toggleFeature = async (featureName: string, currentState: boolean) => {
    try {
      await simplifiedFeatureFlagService.toggleFlag(featureName, !currentState);
      await loadFeatures(); // Reload to get updated state
    } catch (err) {
      setError(`Failed to toggle ${featureName}`);
      console.error('Error toggling feature:', err);
    }
  };

  const checkAccess = async (featureName: string) => {
    const access = await simplifiedFeatureFlagService.hasFeatureAccess(featureName, userPlan);
    return access;
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-500';
      case 'BASIC': return 'bg-blue-500';
      case 'PREMIUM': return 'bg-purple-500';
      case 'ENTERPRISE': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading security features...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Security Dashboard</h2>
        <p className="text-gray-600">Manage advanced security features for your billing application</p>
      </div>

      {/* Plan Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Plan (Demo Mode):
        </label>
        <select
          value={userPlan}
          onChange={(e) => setUserPlan(e.target.value)}
          title="Select current plan for demo"
          aria-label="Select current plan for demo"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FREE">FREE</option>
          <option value="BASIC">BASIC</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Security Features Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <SecurityFeatureCard
            key={feature.name}
            feature={feature}
            userPlan={userPlan}
            onToggle={toggleFeature}
            checkAccess={checkAccess}
            getPlanBadgeColor={getPlanBadgeColor}
          />
        ))}
      </div>

      {/* Revenue Model Display */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💰 Revenue Model</h3>
        <div className="grid gap-2 md:grid-cols-4 text-sm">
          <div className="p-2 bg-white rounded border">
            <strong>FREE</strong>: Basic billing
          </div>
          <div className="p-2 bg-white rounded border">
            <strong>BASIC (₹1,499/mo)</strong>: + 2FA, OAuth
          </div>
          <div className="p-2 bg-white rounded border">
            <strong>PREMIUM (₹3,999/mo)</strong>: + RBAC, API Keys
          </div>
          <div className="p-2 bg-white rounded border">
            <strong>ENTERPRISE (₹7,999/mo)</strong>: + All Features
          </div>
        </div>
      </div>
    </div>
  );
};

interface SecurityFeatureCardProps {
  feature: SecurityFeature;
  userPlan: string;
  onToggle: (name: string, currentState: boolean) => void;
  checkAccess: (name: string) => Promise<{ hasAccess: boolean; reason?: string }>;
  getPlanBadgeColor: (plan: string) => string;
}

const SecurityFeatureCard: React.FC<SecurityFeatureCardProps> = ({
  feature,
  userPlan,
  onToggle,
  checkAccess,
  getPlanBadgeColor
}) => {
  const [hasAccess, setHasAccess] = useState<{ hasAccess: boolean; reason?: string }>({ hasAccess: false });

  useEffect(() => {
    const loadAccess = async () => {
      const access = await checkAccess(feature.name);
      setHasAccess(access);
    };
    loadAccess();
  }, [feature.name, userPlan, checkAccess]);

  return (
    <div className={`p-4 border rounded-lg ${hasAccess.hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{feature.displayName}</h3>
        {feature.requiredPlan && (
          <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getPlanBadgeColor(feature.requiredPlan)}`}>
            {feature.requiredPlan}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {hasAccess.hasAccess ? (
            <span className="text-green-600">✅ Available</span>
          ) : (
            <span className="text-red-600">❌ {hasAccess.reason}</span>
          )}
        </div>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={feature.enabled}
            onChange={() => onToggle(feature.name, feature.enabled)}
            disabled={!hasAccess.hasAccess}
            className="mr-2"
          />
          <span className="text-sm">Enabled</span>
        </label>
      </div>
    </div>
  );
};

export default SecurityDashboard;
