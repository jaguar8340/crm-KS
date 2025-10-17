import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Car as CarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Vehicles({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.marke.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modell.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.chassis_nr && vehicle.chassis_nr.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  const fetchVehicles = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Fehler beim Laden der Fahrzeuge");
    }
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `${customer.vorname} ${customer.name}` : "Unbekannt";
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="vehicles-title">
            Fahrzeuge
          </h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Suche nach Marke, Modell oder Chassis-Nr..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
            data-testid="vehicle-search-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`vehicle-card-${vehicle.id}`}>
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <div className="flex items-center gap-2">
                  <CarIcon className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.marke} {vehicle.modell}
                    </CardTitle>
                    <p className="text-sm opacity-90">Chassis: {vehicle.chassis_nr}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Kunde:</strong> {getCustomerName(vehicle.customer_id)}</div>
                  {vehicle.stamm_nr && <div><strong>Stamm-Nr:</strong> {vehicle.stamm_nr}</div>}
                  {vehicle.farbe && <div><strong>Farbe:</strong> {vehicle.farbe}</div>}
                  {vehicle.km_stand && <div><strong>KM-Stand:</strong> {vehicle.km_stand}</div>}
                  {vehicle.inverkehrsetzung && <div><strong>Inverkehrsetzung:</strong> {vehicle.inverkehrsetzung}</div>}
                  {vehicle.verkaeufer && <div><strong>Verkäufer:</strong> {vehicle.verkaeufer}</div>}
                  {vehicle.kundenberater && <div><strong>Kundenberater:</strong> {vehicle.kundenberater}</div>}
                </div>
                <Button
                  onClick={() => navigate(`/customers/${vehicle.customer_id}`)}
                  className="w-full mt-4"
                  variant="outline"
                  data-testid={`view-vehicle-customer-${vehicle.id}`}
                >
                  Kunde anzeigen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Fahrzeuge gefunden</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
