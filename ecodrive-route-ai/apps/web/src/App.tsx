import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Search, Menu, Home, BarChart2, Gift, Clock, Settings as SettingsIcon } from 'lucide-react';
import { DriveMap } from './components/ui/Map';
import { getUser } from './lib/auth';
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
}

interface EnergyResult {
  energyConsumption: number;
  fuelConsumption: number;
  fuelUnit: string;
  consumptionUnit: string;
  co2Emissions: number;
  tripCost: number;
}

const calculateEnergy = (
  mass: number,
  cd: number,
  frontalArea: number,
  distance: number,
  isElectric: boolean
): EnergyResult => {
  const AIR_DENSITY = 1.225;
  const GRAVITY = 9.81;
  const ROLLING_RESISTANCE = 0.01;
  const FUEL_DENSITY_GASOLINE = 8.9;

  const dragForce = 0.5 * AIR_DENSITY * cd * frontalArea * 13.89 ** 2;
  const cosTheta = 1;
  const rollForce = ROLLING_RESISTANCE * mass * GRAVITY * cosTheta;
  const gradeForce = 0;
  const totalForce = dragForce + rollForce + gradeForce;
  const energyJoules = totalForce * distance;
  const energyKwh = energyJoules / 3_600_000;

  let fuelUnit = 'kWh';
  let consumptionUnit = 'kWh/100km';
  let fuelConsumption = energyKwh;

  if (!isElectric) {
    fuelConsumption = energyKwh / FUEL_DENSITY_GASOLINE;
    fuelUnit = 'liters';
    consumptionUnit = 'liters/100km';
  }

  const co2Emissions = isElectric
    ? Math.round(energyKwh * 0.5 * 100) / 100
    : Math.round(fuelConsumption * 2.3 * 100) / 100;

  const tripCost = isElectric
    ? Math.round(energyKwh * 0.15 * 100) / 100
    : Math.round(fuelConsumption * 2.1 * 100) / 100;

  return {
    energyConsumption: Math.round(energyKwh * 100) / 100,
    fuelConsumption: Math.round(fuelConsumption * 100) / 100,
    fuelUnit,
    consumptionUnit,
    co2Emissions,
    tripCost,
  };
};

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
}

function Navigation() {
  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="p-2">
            <Search className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold text-foreground">EcoDrive Route AI</span>
        </div>
        <div className="hidden sm:flex items-center gap-8">
          <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/navigate" className="text-sm font-medium hover:text-primary transition-colors">EcoRoute</Link>
          <Link to="/garage" className="text-sm font-medium hover:text-primary transition-colors">My Garage</Link>
          <Link to="/analytics" className="text-sm font-medium hover:text-primary transition-colors">Analytics</Link>
          <Link to="/ai-coach" className="text-sm font-medium hover:text-primary transition-colors">AI Eco Coach</Link>
          <Link to="/impact" className="text-sm font-medium hover:text-primary transition-colors">Green Impact</Link>
          <Link to="/history" className="text-sm font-medium hover:text-primary transition-colors">Trip History</Link>
          <Link to="/settings" className="text-sm font-medium hover:text-primary transition-colors">Settings</Link>
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <Button variant="ghost" className="p-2">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login', { replace: true });
  }, [isLoading, user, navigate]);

  return isLoading ? <div className="min-h-screen flex items-center justify-center">Loading...</div> : (user ? children : null);
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/login" element={<></>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Sidebar />
                  <main className="col-span-2 md:col-span-2">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/navigate" element={<EcoRouteNavigation />} />
                      <Route path="/garage" element={<Garage />} />
                      <Route path="/analytics" element={<EcoDriveAnalytics />} />
                      <Route path="/ai-coach" element={<AIEcoCoach />} />
                      <Route path="/impact" element={<GreenImpact />} />
                      <Route path="/history" element={<TripHistory />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

function Sidebar() {
  return (
    <nav className="mt-6 space-y-2">
      <Button variant="outline">
        <Home className="h-4 w-4" /> Dashboard
      </Button>
      <Button variant="outline">
        <BarChart2 className="h-4 w-4" /> Analytics
      </Button>
      <Button variant="outline">
        <Gift className="h-4 w-4" /> AI Eco Coach
      </Button>
      <Button variant="outline">
        <Clock className="h-4 w-4" /> Green Impact
      </Button>
      <Button variant="outline">
        <Clock className="h-4 w-4" /> Trip History
      </Button>
      <Button variant="outline">
        <SettingsIcon className="h-4 w-4" /> Settings
      </Button>
    </nav>
  );
}

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
      <Card className="p-6">
        <h2 className="text-xl font-medium mb-4">Welcome to EcoDrive Route AI</h2>
        <p className="text-muted-foreground">
          Drive smarter, save energy, and protect the planet. Start by selecting your vehicle and planning an eco-friendly route.
        </p>
      </Card>
    </div>
  );
}

function EcoRouteNavigation() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState(null);
  const [energyResults, setEnergyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const vehicles = [
    { id: '1', make: 'Toyota', model: 'Corolla', year: 2020, fuelType: 'hybrid' },
    { id: '2', make: 'Tesla', model: 'Model 3', year: 2023, fuelType: 'electric' },
    { id: '3', make: 'BMW', model: 'i3', year: 2019, fuelType: 'electric' },
  ];

  useEffect(() => {
    const savedVehicle = localStorage.getItem('selectedVehicle');
    if (savedVehicle) {
      setSelectedVehicleId(savedVehicle);
    }
  }, []);

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-test-1234567890abcdef'
        },
        body: JSON.stringify({
          coordinates: [
            [23.3261, 42.6984],  // Sofia
            [23.3321, 42.6905]   // Sofia city center
          ],
          instructions: true,
          resolve: true
        })
      });
      const data = await response.json();
      if (response.ok && data.routes && data.routes.length > 0) {
        setRoute(data.routes[0].geometry);
        // Calculate energy consumption for the route
        const distance = data.routes[0].distance; // in meters
        const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[1];
        const isElectric = vehicle.fuelType === 'electric';
        const result = calculateEnergy(
          isElectric ? 1800 : 1500, // mass in kg
          isElectric ? 0.28 : 0.32, // drag coefficient
          isElectric ? 2.1 : 2.3, // frontal area in m²
          distance,
          isElectric
        );
        setEnergyResults([...energyResults, result as EnergyResult]);
      } else {
        console.error('Routing error:', data);
      }
    } catch (error) {
      console.error('Routing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">EcoRoute Navigation</h1>
      <Card className="p-6">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle</label>
              <select
                className="w-full p-3 rounded-md border-border/50"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Starting Location</label>
              <Input
                placeholder="Enter starting location or coordinates"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Destination</label>
            <Input
              placeholder="Enter destination or coordinates"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <Button type="submit" onClick={calculateRoute} className="w-full" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate EcoRoute'}
          </Button>
        </form>
        {route && (
          <DriveMap center={[route[0][1], route[0][0]]} zoom={6} />
        )}
        {!route && (
          <p className="text-sm text-muted-foreground mt-4">
            Enter origin and destination to calculate an eco-route.
          </p>
        )}
        {energyResults.length > 0 && (
          <div className="mt-6 p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <h2 className="text-sm font-medium mb-3">Energy Efficiency Analysis</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Estimated Energy</p>
                <p>{energyResults[energyResults.length - 1].fuelConsumption}{energyResults[energyResults.length - 1].fuelUnit}</p>
              </div>
              <div>
                <p className="font-medium">Estimated CO₂</p>
                <p>{energyResults[energyResults.length - 1].co2Emissions} kg</p>
              </div>
              <div>
                <p className="font-medium">Trip Cost</p>
                <p>{energyResults[energyResults.length - 1].tripCost} BGN</p>
              </div>
              <div>
                <p className="font-medium">Consumption</p>
                <p>{energyResults[energyResults.length - 1].consumptionUnit}</p>
              </div>
            </div>
          </div>
        )}
        {energyResults.length > 1 && (
          <div className="mt-6 p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <h2 className="text-sm font-medium mb-3">Route Comparison</h2>
            <p className="text-sm text-muted-foreground mb-2">Best route: {energyResults.reduce((best, current) => current.tripCost < best.tripCost ? current : best).fuelUnit === 'kWh' ? 'Electric' : 'Gas'} ({energyResults.reduce((best, current) => current.tripCost < best.tripCost ? current : best).tripCost} BGN)</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Garage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const loadVehicles = async () => {
      // Demo vehicle data - will be replaced with database fetch
      const demoVehicles: Vehicle[] = [
        { id: '1', make: 'Toyota', model: 'Corolla', year: 2020, fuelType: 'hybrid' },
        { id: '2', make: 'Tesla', model: 'Model 3', year: 2023, fuelType: 'electric' },
        { id: '3', make: 'BMW', model: 'i3', year: 2019, fuelType: 'electric' },
      ];
      setVehicles(demoVehicles);
    };
    loadVehicles();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Garage</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Select your vehicle to get personalized eco-route calculations.</p>
        <select className="w-full p-3 rounded-md border-border/50 mb-4">
          <option value="">-- Select Vehicle --</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </option>
          ))}
        </select>
      </Card>
    </div>
  );
}

function EcoDriveAnalytics() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const savedTrips = localStorage.getItem('trips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  const addTrip = (trip: Trip) => {
    setTrips([...trips, trip]);
    localStorage.setItem('trips', JSON.stringify([...trips, trip]));
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">EcoDrive Analytics</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Trip recording and GPS filtering</p>
        <button
          onClick={() => {
            // Simulate a recorded trip
            const syntheticTrip: Trip = {
              id: Date.now().toString(),
              name: 'Recent Trip',
              distance: Math.random() * 20 + 5,
              duration: Math.random() * 60 + 10,
              avgEnergyConsumption: Math.random() * 8 + 3,
              co2Saved: Math.random() * 0.5 + 0.1,
              startLocation: [42.6984, 23.3261],
              endLocation: [42.6800, 23.3400],
              date: new Date().toISOString(),
            };
            addTrip(syntheticTrip);
          }}
          className="button w-full mb-4"
        >
          Record Test Trip
        </button>
        {trips.length > 0 && (
          <h2 className="text-xl font-medium mb-4">Recorded Trips</h2>
        )}
        {trips.map((trip) => (
          <div key={trip.id} className="p-4 rounded-md mb-2" style={{backgroundColor: 'rgba(34, 197, 94, 0.05)'}}>
            <div className="flex justify-between items-start">
              <span className="font-medium">{trip.name}</span>
              <span className="text-sm text-muted-foreground">{trip.date.substring(0, 10)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <div>
                <p className="font-medium">Distance</p>
                <p>{trip.distance.toFixed(1)} km</p>
              </div>
              <div>
                <p className="font-medium">Duration</p>
                <p>{trip.duration.toFixed(0)} min</p>
              </div>
              <div>
                <p className="font-medium">Energy/100km</p>
                <p>{trip.avgEnergyConsumption.toFixed(1)} kWh</p>
              </div>
              <div>
                <p className="font-medium">CO₂ Saved</p>
                <p>{trip.co2Saved.toFixed(2)} kg</p>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

type Trip = {
  id: string;
  name: string;
  distance: number;
  duration: number;
  avgEnergyConsumption: number;
  co2Saved: number;
  startLocation: Center;
  endLocation: Center;
  date: string;
}

function AIEcoCoach() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const savedRecs = localStorage.getItem('aiRecommendations');
    if (savedRecs) {
      setRecommendations(JSON.parse(savedRecs));
    }
  }, []);

  const generateRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze recent trips and vehicle to generate personalized recommendations
      const recentTrips = trips.filter(t => new Date().getTime() - new Date(t.date).getTime() < 30 * 24 * 60 * 60 * 1000);
      const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[1];

      // Generate recommendations based on driving patterns
      const recs: Recommendation[] = [];

      // Check energy efficiency
      if (recentTrips.length > 0) {
        const avgConsumption = recentTrips.reduce((sum, t) => sum + t.avgEnergyConsumption, 0) / recentTrips.length;
        if (avgConsumption > 6) {
          recs.push({
            id: '1',
            title: 'Smooth Acceleration',
            description: 'Avoid rapid acceleration to improve energy efficiency by up to 20%',
            impact: 'high',
            category: 'driving_style'
          });
        }
        if (avgConsumption < 4) {
          recs.push({
            id: '2',
            title: 'Excellent Driving',
            description: 'Keep up the efficient driving habits!',
            impact: 'positive',
            category: 'driving_style'
          });
        }
      }

      // Check vehicle efficiency
      if (vehicle.fuelType === 'hybrid') {
        recs.push({
          id: '3',
          title: 'Consider Electric Switch',
          description: 'Switching to electric could save up to 60% on energy costs',
          impact: 'high',
          category: 'vehicle_switch'
        });
      }

      setRecommendations(recs);
      localStorage.setItem('aiRecommendations', JSON.stringify(recs));
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">AI Eco Coach</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Personalized eco-driving recommendations</p>
        {isAnalyzing && <p className="text-sm text-muted-foreground">Analyzing your driving patterns...</p>}
        <button
          onClick={generateRecommendations}
          disabled={isAnalyzing}
          className="button w-full mb-4"
        >
          {isAnalyzing ? 'Analyzing...' : 'Generate Recommendations'}
        </button>
        {recommendations.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 rounded-md" style={{backgroundColor: rec.impact === 'high' ? 'rgba(239, 68, 68, 0.1)' : rec.impact === 'positive' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)'}}">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={rec.impact === 'high' ? 'text-red-600' : rec.impact === 'positive' ? 'text-emerald-600' : 'text-slate-500'} className="font-medium">{rec.title}</h3>
                  <span className="text-xs text-muted-foreground">{rec.category}</span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            ))}
            {recommendations.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet. Click Generate to get started.</p>}
          </div>
        )}
        <div className="mt-6 p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.05)'}}>
          <h2 className="text-sm font-medium mb-3">How it works</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Analyzes your recent driving patterns and trip data</li>
            <li>Compares against eco-driving best practices</li>
            <li>Considers your vehicle type and efficiency</li>
            <li>Provides personalized actionable recommendations</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'positive' | 'neutral';
  category: 'driving_style' | 'vehicle_switch' | 'route_optimization';
}

function GreenImpact() {
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalCO2Saved, setTotalCO2Saved] = useState(0);
  const [totalEnergySaved, setTotalEnergySaved] = useState(0);

  useEffect(() => {
    const savedTrips = localStorage.getItem('trips');
    if (savedTrips) {
      const trips = JSON.parse(savedTrips);
      setTotalTrips(trips.length);
      setTotalDistance(trips.reduce((sum, t) => sum + t.distance, 0));
      setTotalCO2Saved(trips.reduce((sum, t) => sum + t.co2Saved, 0));
      setTotalEnergySaved(trips.reduce((sum, t) => sum + t.avgEnergyConsumption * t.distance / 100, 0));
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Green Impact</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Environmental impact statistics</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <div className="text-2xl font-bold text-emerald-600">{totalTrips}</div>
            <div className="text-sm text-muted-foreground">Trips Recorded</div>
          </div>
          <div className="p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <div className="text-2xl font-bold text-emerald-600">{totalDistance.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">km Driven</div>
          </div>
          <div className="p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <div className="text-2xl font-bold text-emerald-600">{totalCO2Saved.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">kg CO₂ Saved</div>
          </div>
          <div className="p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
            <div className="text-2xl font-bold text-emerald-600">{totalEnergySaved.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">kWh Saved</div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-medium mb-3">Monthly Savings Trend</h2>
          <div className="h-64 relative">
            <BarChart data={generateMonthlyData()} />
          </div>
        </div>
        <div className="mt-6 p-4 rounded-md" style={{backgroundColor: 'rgba(34, 197, 94, 0.05)'}}>
          <h2 className="text-sm font-medium mb-3">How to Maximize Your Impact</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Plan eco-routes for regular trips</li>
            <maintain smooth acceleration</li>
            <li>Keep vehicle well-maintained</li>
            <li>Consider carpooling for long distances</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function generateMonthlyData() {
  // Generate sample monthly data for the bar chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseCO2 = totalCO2Saved / 12;
  const baseEnergy = totalEnergySaved / 12;
  return months.map((month, index) => ({
    month,
    co2: Math.max(0, baseCO2 + (Math.random() - 0.5) * 0.1),
    energy: Math.max(0, baseEnergy + (Math.random() - 0.5) * 0.5),
  }));
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function TripHistory() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Trip History</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Trip history coming soon...</p>
      </Card>
    </div>
  );
}

function Settings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Application settings coming soon...</p>
      </Card>
    </div>
  );
}