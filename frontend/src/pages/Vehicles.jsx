import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Car as CarIcon, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Vehicles({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
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

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/vehicles/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn("Import errors:", response.data.errors);
        toast.warning(`${response.data.errors.length} Fehler beim Import. Siehe Konsole für Details.`);
      }
      setUploadDialogOpen(false);
      fetchVehicles();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Fehler beim Hochladen der CSV-Datei");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadCSVTemplate = () => {
    const headers = "kunden_nr,marke,modell,chassis_nr,stamm_nr,typenschein_nr,farbe,inverkehrsetzung,km_stand,vista_nr,verkaeufer,kundenberater\n";
    const example = "K001,BMW,X5,WBAFR110000000000,S12345,T67890,Schwarz,2020-03-15,45000,V123,Peter Müller,Anna Schmidt\n";
    const blob = new Blob([headers + example], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fahrzeuge_vorlage.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="vehicles-title">
            Fahrzeuge
          </h1>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" data-testid="upload-vehicles-csv-button">
                <Upload className="w-4 h-4" />
                CSV Hochladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fahrzeuge CSV hochladen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Laden Sie eine CSV-Datei mit Fahrzeugdaten hoch. Die CSV muss die Kundennummer (kunden_nr) enthalten,
                  um das Fahrzeug dem richtigen Kunden zuzuordnen.
                  <br /><br />
                  Spalten: kunden_nr, marke, modell, chassis_nr, stamm_nr, typenschein_nr, farbe, inverkehrsetzung, km_stand, vista_nr, verkaeufer, kundenberater
                </p>
                <Button
                  variant="outline"
                  onClick={downloadCSVTemplate}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Vorlage herunterladen
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={uploading}
                  data-testid="vehicles-csv-file-input"
                />
                {uploading && <p className="text-sm text-gray-600">Hochladen...</p>}
              </div>
            </DialogContent>
          </Dialog>
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

        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
            <CardTitle>Fahrzeugliste ({filteredVehicles.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marke</TableHead>
                    <TableHead>Modell</TableHead>
                    <TableHead>Chassis-Nr</TableHead>
                    <TableHead>Farbe</TableHead>
                    <TableHead>KM-Stand</TableHead>
                    <TableHead>Verkäufer</TableHead>
                    <TableHead>Kundenberater</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                      <TableCell className="font-medium">{vehicle.marke}</TableCell>
                      <TableCell>{vehicle.modell}</TableCell>
                      <TableCell>{vehicle.chassis_nr}</TableCell>
                      <TableCell>{vehicle.farbe || "-"}</TableCell>
                      <TableCell>{vehicle.km_stand || "-"}</TableCell>
                      <TableCell>{vehicle.verkaeufer || "-"}</TableCell>
                      <TableCell>{vehicle.kundenberater || "-"}</TableCell>
                      <TableCell>{getCustomerName(vehicle.customer_id)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => navigate(`/customers/${vehicle.customer_id}`)}
                          size="sm"
                          variant="outline"
                          data-testid={`view-vehicle-customer-${vehicle.id}`}
                        >
                          Kunde
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Keine Fahrzeuge gefunden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
