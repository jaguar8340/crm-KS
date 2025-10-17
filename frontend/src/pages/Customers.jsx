import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Customers({ user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    kunden_nr: "",
    vorname: "",
    name: "",
    firma: "",
    strasse: "",
    plz: "",
    ort: "",
    telefon_p: "",
    telefon_g: "",
    natel: "",
    email_p: "",
    email_g: "",
    geburtsdatum: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.kunden_nr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.firma && customer.firma.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Fehler beim Laden der Kunden");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/customers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Kunde erfolgreich hinzugefügt!");
      setDialogOpen(false);
      setFormData({
        kunden_nr: "",
        vorname: "",
        name: "",
        firma: "",
        strasse: "",
        plz: "",
        ort: "",
        telefon_p: "",
        telefon_g: "",
        natel: "",
        email_p: "",
        email_g: "",
        geburtsdatum: "",
      });
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Fehler beim Hinzufügen des Kunden");
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }} data-testid="customers-title">
            Kundenverwaltung
          </h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="add-customer-button">
                <Plus className="w-4 h-4" />
                Kunde hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Kunden hinzufügen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kunden_nr">Kunden-Nr.*</Label>
                    <Input
                      id="kunden_nr"
                      data-testid="customer-number-input"
                      value={formData.kunden_nr}
                      onChange={(e) => setFormData({ ...formData, kunden_nr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vorname">Vorname*</Label>
                    <Input
                      id="vorname"
                      data-testid="customer-firstname-input"
                      value={formData.vorname}
                      onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name*</Label>
                    <Input
                      id="name"
                      data-testid="customer-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firma">Firma</Label>
                    <Input
                      id="firma"
                      value={formData.firma}
                      onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="strasse">Straße*</Label>
                    <Input
                      id="strasse"
                      value={formData.strasse}
                      onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plz">PLZ*</Label>
                    <Input
                      id="plz"
                      value={formData.plz}
                      onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ort">Ort*</Label>
                    <Input
                      id="ort"
                      value={formData.ort}
                      onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon_p">Telefon P</Label>
                    <Input
                      id="telefon_p"
                      value={formData.telefon_p}
                      onChange={(e) => setFormData({ ...formData, telefon_p: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon_g">Telefon G</Label>
                    <Input
                      id="telefon_g"
                      value={formData.telefon_g}
                      onChange={(e) => setFormData({ ...formData, telefon_g: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="natel">Natel</Label>
                    <Input
                      id="natel"
                      value={formData.natel}
                      onChange={(e) => setFormData({ ...formData, natel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_p">Email P</Label>
                    <Input
                      id="email_p"
                      type="email"
                      value={formData.email_p}
                      onChange={(e) => setFormData({ ...formData, email_p: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_g">Email G</Label>
                    <Input
                      id="email_g"
                      type="email"
                      value={formData.email_g}
                      onChange={(e) => setFormData({ ...formData, email_g: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                    <Input
                      id="geburtsdatum"
                      type="date"
                      value={formData.geburtsdatum}
                      onChange={(e) => setFormData({ ...formData, geburtsdatum: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="customer-submit-button">
                  Kunde hinzufügen
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Suche nach Name, Vorname, Kundennummer oder Firma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
            data-testid="customer-search-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow duration-300" data-testid={`customer-card-${customer.id}`}>
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardTitle className="text-lg">
                  {customer.vorname} {customer.name}
                </CardTitle>
                <p className="text-sm opacity-90">Kunden-Nr: {customer.kunden_nr}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  {customer.firma && <p><strong>Firma:</strong> {customer.firma}</p>}
                  <p><strong>Adresse:</strong> {customer.strasse}, {customer.plz} {customer.ort}</p>
                  {customer.telefon_p && <p><strong>Telefon P:</strong> {customer.telefon_p}</p>}
                  {customer.email_p && <p><strong>Email P:</strong> {customer.email_p}</p>}
                </div>
                <Button
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  variant="outline"
                  data-testid={`view-customer-${customer.id}`}
                >
                  <Eye className="w-4 h-4" />
                  Details anzeigen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Keine Kunden gefunden</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
